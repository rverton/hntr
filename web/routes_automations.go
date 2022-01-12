package web

import (
	"context"
	"encoding/json"
	"fmt"
	"hntr/db"
	"hntr/jobs"
	"log"
	"net/http"
	"strconv"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v4"
	"github.com/labstack/echo/v4"
	"github.com/vgarvardt/gue/v3"
)

type AutomationHostnameCount struct {
	db.Automation
	SourceCount int64 `json:"source_count"`
}

func (s *Server) ListAutomations(c echo.Context) error {
	ctx := context.Background()

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		log.Printf("unable to parse id: %v", err)
		return c.JSON(http.StatusNotFound, nil)
	}

	automations, err := s.repo.ListAutomations(ctx, id)
	if err != nil && err != pgx.ErrNoRows {
		log.Printf("listing automations failed: %v", err)
		return c.JSON(http.StatusInternalServerError, nil)
	}

	automationCounts := []AutomationHostnameCount{}

	for _, automation := range automations {
		params := db.CountRecordsByBoxFilterParams{
			BoxID:     automation.BoxID,
			Container: automation.SourceContainer,
			Data:      "%%",
			Column3:   automation.SourceTags,
		}

		count, _ := s.repo.CountRecordsByBoxFilter(ctx, params)

		a := AutomationHostnameCount{
			Automation:  automation,
			SourceCount: count,
		}

		automationCounts = append(automationCounts, a)
	}

	return c.JSON(http.StatusOK, automationCounts)
}

func (s *Server) ListAutomationEvents(c echo.Context) error {
	ctx := context.Background()

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		log.Printf("unable to parse id: %v", err)
		return c.JSON(http.StatusNotFound, nil)
	}

	limit, _ := strconv.Atoi(c.QueryParam("limit"))
	if limit <= 0 {
		limit = 500
	}

	automationEvents, err := s.repo.ListAutomationEvents(ctx, db.ListAutomationEventsParams{
		AutomationID: id,
		Limit:        int32(limit),
	})
	if err != nil && err != pgx.ErrNoRows {
		log.Printf("listing automations failed: %v", err)
		return c.JSON(http.StatusInternalServerError, nil)
	}

	return c.JSON(http.StatusOK, automationEvents)
}

func (s *Server) StartAutomation(c echo.Context) error {
	ctx := context.Background()

	id, err := uuid.Parse(c.Param("id")) // automation id
	if err != nil {
		log.Printf("unable to parse id: %v", err)
		return c.JSON(http.StatusNotFound, nil)
	}

	automation, err := s.repo.GetAutomation(ctx, id)
	if err == pgx.ErrNoRows {
		return c.JSON(http.StatusNotFound, nil)
	}

	if err != nil {
		log.Printf("getting automation failed: %v", err)
		return c.JSON(http.StatusInternalServerError, nil)
	}

	if err := createAndEnqueue(ctx, automation, s.repo, s.queue); err != nil {
		log.Printf("error creating job: %v\n", err)
		return c.JSON(http.StatusInternalServerError, automation)
	}

	return c.JSON(http.StatusOK, automation)
}

func createAndEnqueue(ctx context.Context, automation db.Automation, repo *db.Queries, queue *gue.Client) error {

	// TODO: check if containers exist before enqueing

	// get all entries matching automation.source_table and automation.source_tags
	params := db.ListRecordsByBoxFilterParams{
		BoxID:     automation.BoxID,
		Container: automation.SourceContainer,
		Data:      "%%",
		Column3:   automation.SourceTags,
	}

	records, err := repo.ListRecordsByBoxFilter(ctx, params)
	if err != nil && err != pgx.ErrNoRows {
		return fmt.Errorf("getting records failed: %v", err)
	}

	// create and enqueue job for each entry
	for _, record := range records {

		ae, err := repo.CreateAutomationEvent(ctx, db.CreateAutomationEventParams{
			BoxID:        automation.BoxID,
			AutomationID: automation.ID,
			Status:       "pending",
			Data:         record.Data,
		})
		if err != nil {
			return fmt.Errorf("error creating automation event: %v", err)
		}

		// encode arguments
		args, err := json.Marshal(jobs.RunAutomationArgs{
			JobID:      ae.ID,
			Automation: automation,
			Data:       record.Data,
		})
		if err != nil {
			return fmt.Errorf("error marshaling job: %v", err)
		}

		// create and enqueue job
		j := &gue.Job{
			Type: "RunAutomation",
			Args: args,
		}
		if err := queue.Enqueue(ctx, j); err != nil {
			return fmt.Errorf("error enqueueing job: %v", err)
		}
	}

	return nil
}

func (s *Server) ListAutomationLibrary(c echo.Context) error {
	ctx := context.Background()

	automations, err := s.repo.ListAutomationLibrary(ctx)
	if err != nil && err != pgx.ErrNoRows {
		log.Printf("listing automations failed: %v", err)
		return c.JSON(http.StatusInternalServerError, nil)
	}

	return c.JSON(http.StatusOK, automations)
}

func (s *Server) AddAutomation(c echo.Context) error {
	ctx := context.Background()

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusNotFound, nil)
	}

	box, err := s.repo.GetBox(ctx, id)

	if err == pgx.ErrNoRows {
		return c.JSON(http.StatusNotFound, nil)
	}

	if err != nil {
		return c.JSON(http.StatusInternalServerError, box)
	}

	automation := new(db.Automation)
	if err = c.Bind(automation); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "invalid destination data",
		})
	}

	// TODO: check if container exists

	if len(automation.SourceTags) > TAGS_MAX || len(automation.DestinationTags) > TAGS_MAX {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": fmt.Sprintf("too many tags. max_tags=%v", TAGS_MAX),
		})
	}

	automationCreated, err := s.repo.CreateAutomation(ctx, db.CreateAutomationParams{
		BoxID:                box.ID,
		Name:                 automation.Name,
		Description:          automation.Description,
		Command:              automation.Command,
		SourceContainer:      automation.SourceContainer,
		SourceTags:           automation.SourceTags,
		DestinationContainer: automation.DestinationContainer,
		DestinationTags:      automation.DestinationTags,
	})
	if err != nil {
		log.Printf("error creating automation: %v", err)
		return c.JSON(http.StatusInternalServerError, nil)
	}

	return c.JSON(http.StatusOK, automationCreated)
}

func (s *Server) RemoveAutomation(c echo.Context) error {
	ctx := context.Background()

	id, err := uuid.Parse(c.Param("id")) // automation id
	if err != nil {
		log.Printf("unable to parse id: %v", err)
		return c.JSON(http.StatusNotFound, nil)
	}

	if err = s.repo.DeleteAutomation(ctx, id); err != nil {
		log.Printf("deleting automation failed: %v", err)
		return c.JSON(http.StatusInternalServerError, nil)
	}

	return c.JSON(http.StatusOK, nil)
}

func inStringSlice(s string, slice []string) bool {
	for _, s2 := range slice {
		if s == s2 {
			return true
		}
	}
	return false
}
