package web

import (
	"context"
	"hntr/db"
	"log"
	"net/http"

	"github.com/labstack/echo/v4"
)

func (s *Server) Index(c echo.Context) error {
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
