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

func (s *Server) ListBoxes(c echo.Context) error {
	ctx := context.Background()

	var boxes []db.Box
	var err error

	boxes, err = s.repo.ListBoxes(ctx)
	if err != nil {
		log.Printf("listing boxes failed: %v", err)
		return c.JSON(http.StatusInternalServerError, boxes)
	}

	return c.JSON(http.StatusOK, boxes)
}

func (s *Server) CreateBox(c echo.Context) error {
	ctx := context.Background()

	box, err := s.repo.CreateBox(ctx, "Unnamed Box")
	if err != nil {
		log.Printf("creating box failed: %v", err)
		return c.JSON(http.StatusInternalServerError, nil)
	}

	return c.JSON(http.StatusOK, box)
}
