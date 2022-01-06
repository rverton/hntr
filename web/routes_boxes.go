package web

import (
	"context"
	"hntr/db"
	"log"
	"net/http"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v4"
	"github.com/labstack/echo/v4"
)

func (s *Server) GetBox(c echo.Context) error {
	ctx := context.Background()

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		log.Printf("unable to parse id: %v", err)
		return c.JSON(http.StatusNotFound, nil)
	}

	box, err := s.repo.GetBox(ctx, id)

	if err == pgx.ErrNoRows {
		return c.JSON(http.StatusNotFound, nil)
	}

	if err != nil {
		log.Printf("getting box failed: %v", err)
		return c.JSON(http.StatusInternalServerError, box)
	}

	return c.JSON(http.StatusOK, box)
}

func (s *Server) CreateBox(c echo.Context) error {
	ctx := context.Background()

	box, err := s.repo.CreateBox(ctx, db.CreateBoxParams{
		Name:       "Unnamed Box",
		Containers: []string{"hostnames", "urls", "events"},
	})
	if err != nil {
		log.Printf("creating box failed: %v", err)
		return c.JSON(http.StatusInternalServerError, nil)
	}

	return c.JSON(http.StatusOK, box)
}

func (s *Server) AddContainer(c echo.Context) error {
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

	type UpdateBox struct {
		Name       string   `json:"name"`
		Containers []string `json:"containers"`
	}

	boxNew := new(UpdateBox)
	if err = c.Bind(boxNew); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "invalid box data",
		})
	}

	// TODO: add validation

	if err = s.repo.UpdateBox(ctx, db.UpdateBoxParams{
		ID:         box.ID,
		Name:       boxNew.Name,
		Containers: boxNew.Containers,
	}); err != nil {
		return c.JSON(http.StatusInternalServerError, nil)
	}

	return c.JSON(http.StatusOK, boxNew)
}
