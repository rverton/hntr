package web

import (
	"context"
	"fmt"
	"hntr/db"
	"log"
	"net/http"
	"strings"

	"github.com/go-playground/validator/v10"
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

func (s *Server) UpdateBox(c echo.Context) error {
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
		Name       string   `json:"name" validate:"required,min=2,max=25"`
		Containers []string `json:"containers" validate:"required,min=1,max=5,dive,min=2,max=25"`
	}

	boxNew := new(UpdateBox)
	if err = c.Bind(boxNew); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "invalid box data",
		})
	}

	if err = c.Validate(boxNew); err != nil {
		errors := err.(validator.ValidationErrors)

		firstError := errors[0]

		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": fmt.Sprintf("%s: %s", firstError.Field(), validationErrorMsg(firstError)),
		})
	}

	var containersLower []string
	for _, c := range boxNew.Containers {
		containersLower = append(containersLower, strings.ToLower(c))
	}

	if err = s.repo.UpdateBox(ctx, db.UpdateBoxParams{
		ID:         box.ID,
		Name:       boxNew.Name,
		Containers: containersLower,
	}); err != nil {
		return c.JSON(http.StatusInternalServerError, nil)
	}

	return c.JSON(http.StatusOK, boxNew)
}
