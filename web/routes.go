package web

import (
	"context"
	"database/sql"
	"hntr/db"
	"io"
	"log"
	"net/http"
	"strings"

	"github.com/google/uuid"
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

	if err == sql.ErrNoRows {
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

func (s *Server) ListHostnames(c echo.Context) error {
	ctx := context.Background()

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		log.Printf("unable to parse id: %v", err)
		return c.JSON(http.StatusNotFound, nil)
	}

	// term
	term := c.QueryParam("term")

	searchword, tags := parseTerm(term)

	params := db.ListHostnamesByBoxFilterParams{
		BoxID:    id,
		Hostname: "%" + searchword + "%",
		Column3:  tags,
	}

	hostnames, err := s.repo.ListHostnamesByBoxFilter(ctx, params)
	if err != nil && err != sql.ErrNoRows {
		log.Printf("listing boxes failed: %v", err)
		return c.JSON(http.StatusInternalServerError, nil)
	}

	return c.JSON(http.StatusOK, hostnames)
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

	return c.JSON(http.StatusOK, automations)
}

func (s *Server) StartAutomation(c echo.Context) error {
	ctx := context.Background()

	id, err := uuid.Parse(c.Param("id"))
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

	return c.JSON(http.StatusOK, automation)
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

func (s *Server) AddHostnames(c echo.Context) error {
	ctx := context.Background()

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		log.Printf("unable to parse id: %v", err)
		return c.JSON(http.StatusNotFound, nil)
	}

	b, err := io.ReadAll(c.Request().Body)
	if err != nil {
		log.Printf("unable to read request body: %v", err)
		return c.JSON(http.StatusBadRequest, nil)
	}

	// split tags
	tags := strings.FieldsFunc(c.QueryParam("tags"), func(c rune) bool {
		return c == ','
	})

	added := 0

	for _, line := range strings.Split(string(b), "\n") {

		if line == "" {
			continue
		}

		data := db.CreateHostnameParams{
			Hostname: line,
			BoxID:    id,
			Tags:     tags,
			Source:   "api",
		}

		err := s.repo.CreateHostname(ctx, data)
		if err != nil {
			log.Printf("creating hostname failed: %v", err)
		} else {
			added++
		}

	}

	return c.JSON(http.StatusOK, map[string]int{
		"added": added,
	})
}

func parseTerm(term string) (string, []string) {

	tags := make([]string, 0)
	searchword := ""

	// split terms by space
	keywords := strings.FieldsFunc(term, func(c rune) bool {
		return c == ' '
	})

	for _, k := range keywords {
		if strings.HasPrefix(k, "tag:") {
			tag := k[4:]
			if tag == "" {
				continue
			}

			tags = append(tags, tag)
		} else {
			searchword = k
		}
	}

	return searchword, tags
}
