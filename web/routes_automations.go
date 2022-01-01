package web

import (
	"context"
	"database/sql"
	"encoding/json"
	"hntr/db"
	"hntr/jobs"
	"log"
	"net/http"

	"github.com/google/uuid"
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
	if err != nil && err != sql.ErrNoRows {
		log.Printf("listing automations failed: %v", err)
		return c.JSON(http.StatusInternalServerError, nil)
	}

	var automationCounts []AutomationHostnameCount

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

func (s *Server) StartAutomation(c echo.Context) error {
	ctx := context.Background()

	id, err := uuid.Parse(c.Param("id")) // automation id
	if err != nil {
		log.Printf("unable to parse id: %v", err)
		return c.JSON(http.StatusNotFound, nil)
	}

	automation, err := s.repo.GetAutomation(ctx, id)
	if err == sql.ErrNoRows {
		return c.JSON(http.StatusNotFound, nil)
	}

	if err != nil {
		log.Printf("getting automation failed: %v", err)
		return c.JSON(http.StatusInternalServerError, nil)
	}

	// TODO: switch based on table

	// get all entries matching automation.source_table and automation.source_tags
	params := db.ListHostnamesByBoxFilterParams{
		BoxID:    automation.BoxID,
		Hostname: "%%",
		Column3:  automation.SourceTags,
	}

	hostnames, err := s.repo.ListHostnamesByBoxFilter(ctx, params)
	if err != nil && err != sql.ErrNoRows {
		log.Printf("getting hostnames failed: %v", err)
		return c.JSON(http.StatusInternalServerError, nil)
	}

	// enqueue job for each entry
	for _, hostname := range hostnames {

		// enqueue job
		args, err := json.Marshal(jobs.RunAutomationArgs{
			Automation: automation,
			Data:       hostname.Hostname,
		})
		if err != nil {
			log.Println("error marshaling job", err)
		}

		j := &gue.Job{
			Type: "RunAutomation",
			Args: args,
		}
		if err := s.queue.Enqueue(ctx, j); err != nil {
			log.Println("error enqueueing job", err)
		}
	}

	return c.JSON(http.StatusOK, automation)
}
