package web

import (
	"context"
	"encoding/json"
	"fmt"
	"hntr/db"
	"hntr/jobs"
	"log"
	"net/http"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v4"
	"github.com/labstack/echo/v4"
	"github.com/vgarvardt/gue/v3"
)

const TAGS_MAX = 20

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
		params := db.CountHostnamesByBoxFilterParams{
			BoxID:    automation.BoxID,
			Hostname: "%%",
			Column3:  automation.SourceTags,
		}

		count, _ := s.repo.CountHostnamesByBoxFilter(ctx, params)

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

	automationEvents, err := s.repo.ListAutomationEvents(ctx, id)
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

	// TODO: switch source between hostname/URL based on automation.source_table
	// TODO: switch target between hostname/URL based on automation.target_table

	// get all entries matching automation.source_table and automation.source_tags
	params := db.ListHostnamesByBoxFilterParams{
		BoxID:    automation.BoxID,
		Hostname: "%%",
		Column3:  automation.SourceTags,
	}

	hostnames, err := repo.ListHostnamesByBoxFilter(ctx, params)
	if err != nil && err != pgx.ErrNoRows {
		return fmt.Errorf("getting hostnames failed: %v", err)
	}

	// create and enqueue job for each entry
	for _, hostname := range hostnames {

		ae, err := repo.CreateAutomationEvent(ctx, db.CreateAutomationEventParams{
			BoxID:        automation.BoxID,
			AutomationID: automation.ID,
			Status:       "pending",
			Data:         hostname.Hostname,
		})
		if err != nil {
			return fmt.Errorf("error creating automation event: %v", err)
		}

		// encode arguments
		args, err := json.Marshal(jobs.RunAutomationArgs{
			JobID:      ae.ID,
			Automation: automation,
			Data:       hostname.Hostname,
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

	allowedSources := []string{"hostnames"}
	allowedDestinations := []string{"hostnames"}

	if !inStringSlice(automation.SourceTable, allowedSources) ||
		!inStringSlice(automation.DestinationTable, allowedDestinations) {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "source or destination table not allowed",
		})
	}

	if len(automation.SourceTags) > TAGS_MAX || len(automation.DestinationTags) > TAGS_MAX {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": fmt.Sprintf("too many tags. max_tags=%v", TAGS_MAX),
		})
	}

	automationCreated, err := s.repo.CreateAutomation(ctx, db.CreateAutomationParams{
		BoxID:            box.ID,
		Name:             automation.Name,
		Description:      automation.Description,
		Command:          automation.Command,
		SourceTable:      automation.SourceTable,
		SourceTags:       automation.SourceTags,
		DestinationTable: automation.DestinationTable,
		DestinationTags:  automation.DestinationTags,
	})
	if err != nil {
		log.Printf("error creating automation: %v", err)
		return c.JSON(http.StatusInternalServerError, nil)
	}

	return c.JSON(http.StatusOK, automationCreated)
}

func inStringSlice(s string, slice []string) bool {
	for _, s2 := range slice {
		if s == s2 {
			return true
		}
	}
	return false
}
