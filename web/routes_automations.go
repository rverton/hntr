package web

import (
	"context"
	"fmt"
	"hntr/db"
	"log"
	"net/http"
	"strconv"
	"strings"

	"github.com/go-playground/validator/v10"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v4"
	"github.com/labstack/echo/v4"
	"gopkg.in/alessio/shellescape.v1"
)

const REPLACE = "{data}"

type AutomationHostnameCount struct {
	db.Automation
	SourceCount int64 `json:"source_count"`
}

type Automation struct {
	Name                 string   `json:"name" validate:"required,min=1,max=20"`
	Description          string   `json:"description" validate:"required,min=0,max=200"`
	Command              string   `json:"command" validate:"required,min=0,max=500"`
	SourceContainer      string   `json:"source_container" validate:"required,min=0,max=500"`
	SourceTags           []string `json:"source_tags" validate:"required,max=10,dive,min=1,max=50"`
	DestinationContainer string   `json:"destination_container" validate:"required,min=0,max=500"`
	DestinationTags      []string `json:"destination_tags" validate:"required,max=10,dive,min=1,max=50"`
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

func (s *Server) DequeueJobs(c echo.Context) error {
	ctx := context.Background()

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		log.Printf("unable to parse id: %v", err)
		return c.NoContent(http.StatusInternalServerError)
	}

	jobs, err := s.repo.DequeueAutomationEvents(ctx, db.DequeueAutomationEventsParams{
		BoxID: id,
		Limit: 5,
	})

	automations := make(map[uuid.UUID]db.Automation)

	for _, j := range jobs {

		// cache automation
		if _, ok := automations[j.AutomationID]; !ok {
			a, err := s.repo.GetAutomation(ctx, j.AutomationID)
			if err != nil && err != pgx.ErrNoRows {
				log.Printf("loading automation failed: %v", err)
				return c.NoContent(http.StatusInternalServerError)
			}

			if err == pgx.ErrNoRows {
				// todo: set job failed
				continue
			}

			automations[j.AutomationID] = a
		}

		current := automations[j.AutomationID]

		// create "command" instruction
		quoted := shellescape.Quote(j.Data)
		quotedCmd := strings.Replace(current.Command, REPLACE, quoted, -1)

		fmt.Fprintf(c.Response(), fmt.Sprintf("%v#%v\n", j.ID, quotedCmd))

	}

	if err != nil && err != pgx.ErrNoRows {
		log.Printf("dequeing jobs failed: %v", err)
		return c.NoContent(http.StatusInternalServerError)
	}

	return nil
}

func (s *Server) UpdateAutomationEvent(c echo.Context) error {
	ctx := context.Background()

	// ignore for now
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		log.Printf("unable to parse id: %v", err)
		return c.NoContent(http.StatusInternalServerError)
	}

	count, err := s.repo.CountRecordsByBox(ctx, id)
	if err != nil {
		log.Printf("getting box count failed: %v", err)
		return c.NoContent(http.StatusInternalServerError)
	}

	jobId, err := uuid.Parse(c.Param("jobid"))
	if err != nil {
		log.Printf("unable to parse id: %v", err)
		return c.NoContent(http.StatusInternalServerError)
	}

	job, err := s.repo.GetAutomationEvent(ctx, jobId)
	if err != nil {
		log.Printf("unable to get automation event by id: %v", err)
		return c.NoContent(http.StatusInternalServerError)
	}

	automation, err := s.repo.GetAutomation(ctx, job.AutomationID)
	if err != nil {
		log.Printf("unable to get matching automation: %v", err)
		return c.NoContent(http.StatusInternalServerError)
	}

	// retrieve automtion data
	affected := db.RecordsBatchInsert(
		ctx,
		s.dbPool,
		c.Request().Body,
		automation.BoxID,
		automation.DestinationContainer,
		automation.DestinationTags,
		int64(s.recordsLimit)-count-1,
	)

	err = s.repo.UpdateAutomationEventStatusFinished(ctx, db.UpdateAutomationEventStatusFinishedParams{
		ID:           jobId,
		Status:       "finished",
		AffectedRows: int32(affected),
	})
	if err != nil {
		log.Printf("unable to update automation event: %v", err)
		return c.NoContent(http.StatusInternalServerError)
	}

	return c.String(http.StatusOK, fmt.Sprintf("%v", affected))
}

func (s *Server) StartAutomation(c echo.Context) error {
	ctx := context.Background()

	id, err := uuid.Parse(c.Param("id")) // automation id
	if err != nil {
		log.Printf("unable to parse id: %v", err)
		return c.JSON(http.StatusNotFound, nil)
	}

	automation, err := s.repo.GetAutomation(ctx, id)
	if err != nil {
		if err == pgx.ErrNoRows {
			return c.JSON(http.StatusNotFound, nil)
		}

		log.Printf("getting automation failed: %v", err)
		return c.JSON(http.StatusInternalServerError, nil)
	}

	// ensure box exists
	box, err := s.repo.GetBox(ctx, automation.BoxID)

	if err != nil {
		if err == pgx.ErrNoRows {
			return c.JSON(http.StatusNotFound, nil)
		}

		log.Printf("getting box failed: %v", err)
		return c.JSON(http.StatusInternalServerError, box)
	}

	if !inStringSlice(automation.SourceContainer, box.Containers) || !inStringSlice(automation.DestinationContainer, box.Containers) {
		return c.JSON(http.StatusNotFound, nil)
	}

	go func(automation db.Automation, repo *db.Queries) {
		if err := createAndEnqueue(context.Background(), automation, repo); err != nil {
			log.Printf("error creating jobs: %v\n", err)
		}
	}(automation, s.repo)

	return c.JSON(http.StatusOK, automation)
}

func createAndEnqueue(ctx context.Context, automation db.Automation, repo *db.Queries) error {

	// get all entries matching automation.source_table and automation.source_tags
	params := db.ListRecordsByBoxFilterParams{
		BoxID:     automation.BoxID,
		Container: automation.SourceContainer,
		Data:      "%%", // TODO: use other query here to optimize search
		Column3:   automation.SourceTags,
	}

	records, err := repo.ListRecordsByBoxFilter(ctx, params)
	if err != nil && err != pgx.ErrNoRows {
		return fmt.Errorf("getting records failed: %v", err)
	}

	// create and enqueue job for each entry
	// TODO: do in a batch query
	for _, record := range records {

		_, err := repo.CreateAutomationEvent(ctx, db.CreateAutomationEventParams{
			BoxID:        automation.BoxID,
			AutomationID: automation.ID,
			Status:       "scheduled",
			Data:         record.Data,
		})
		if err != nil {
			return fmt.Errorf("error creating automation event: %v", err)
		}

		// // encode arguments
		// args, err := json.Marshal(jobs.RunAutomationArgs{
		// 	JobID:      ae.ID,
		// 	Automation: automation,
		// 	Data:       record.Data,
		// })
		// if err != nil {
		// 	return fmt.Errorf("error marshaling job: %v", err)
		// }

		// // create and enqueue job
		// j := &gue.Job{
		// 	Type: "RunAutomation",
		// 	Args: args,
		// }
		// if err := queue.Enqueue(ctx, j); err != nil {
		// 	return fmt.Errorf("error enqueueing job: %v", err)
		// }
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

	if err != nil {
		if err == pgx.ErrNoRows {
			return c.JSON(http.StatusNotFound, nil)
		}

		return c.JSON(http.StatusInternalServerError, box)
	}

	automation := new(Automation)
	if err = c.Bind(automation); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "invalid destination data",
		})
	}

	if err = c.Validate(automation); err != nil {
		errors := err.(validator.ValidationErrors)
		firstError := errors[0]

		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": fmt.Sprintf("%s: %s", firstError.Field(), validationErrorMsg(firstError)),
		})
	}

	if !inStringSlice(automation.SourceContainer, box.Containers) || !inStringSlice(automation.DestinationContainer, box.Containers) {
		return c.JSON(http.StatusNotFound, nil)
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

func (s *Server) UpdateAutomation(c echo.Context) error {
	ctx := context.Background()

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusNotFound, nil)
	}

	automation := new(Automation)
	if err = c.Bind(automation); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "invalid destination data",
		})
	}

	if err = c.Validate(automation); err != nil {
		errors := err.(validator.ValidationErrors)
		firstError := errors[0]

		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": fmt.Sprintf("%s: %s", firstError.Field(), validationErrorMsg(firstError)),
		})
	}

	// if !inStringSlice(automation.SourceContainer, box.Containers) || !inStringSlice(automation.DestinationContainer, box.Containers) {
	// 	return c.JSON(http.StatusNotFound, nil)
	// }

	err = s.repo.UpdateAutomation(ctx, db.UpdateAutomationParams{
		Name:                 automation.Name,
		Description:          automation.Description,
		Command:              automation.Command,
		SourceContainer:      automation.SourceContainer,
		SourceTags:           automation.SourceTags,
		DestinationContainer: automation.DestinationContainer,
		DestinationTags:      automation.DestinationTags,
		ID:                   id,
	})
	if err != nil {
		log.Printf("error updating automation: %v", err)
		return c.JSON(http.StatusInternalServerError, nil)
	}

	return c.JSON(http.StatusOK, nil)
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

func deleteEmpty(s []string) []string {
	var r []string
	for _, str := range s {
		if str != "" {
			r = append(r, str)
		}
	}
	return r
}
