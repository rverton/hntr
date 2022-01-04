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
	"github.com/jackc/pgx/v4"
	"github.com/labstack/echo/v4"
)

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

func (s *Server) AddHostnames(c echo.Context) error {
	ctx := context.Background()

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		log.Printf("unable to parse id: %v", err)
		return c.JSON(http.StatusNotFound, nil)
	}

	// TODO: add overall count to limit max. entries in box

	b, err := io.ReadAll(c.Request().Body)
	if err != nil {
		log.Printf("unable to read request body: %v", err)
		return c.JSON(http.StatusBadRequest, nil)
	}

	// split tags
	tags := strings.FieldsFunc(c.QueryParam("tags"), func(c rune) bool {
		return c == ','
	})

	source := c.QueryParam("source")
	if source == "" {
		source = "api"
	}

	tags = append(tags, "source:"+source)

	added := 0
	batch := &pgx.Batch{}

	for _, line := range strings.Split(string(b), "\n") {

		if line == "" {
			continue
		}

		if added > s.insertLimit-1 {
			break
		}

		batch.Queue(
			"INSERT INTO hostnames (box_id, hostname, tags) VALUES ($1, $2, $3)",
			id,
			line,
			tags,
		)
		added++
	}

	br := s.dbPool.SendBatch(ctx, batch)

	var affected int64
	for i := 0; i < added; i++ {
		ct, err := br.Exec()
		if err != nil {
			log.Printf("error executing batch: %v", err)
		}

		affected += ct.RowsAffected()
	}

	if err := br.Close(); err != nil {
		log.Printf("closing failed: %v", err)
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"added": affected,
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
