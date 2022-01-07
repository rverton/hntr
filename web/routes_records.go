package web

import (
	"context"
	"hntr/db"
	"io"
	"log"
	"net/http"
	"strconv"
	"strings"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v4"
	"github.com/labstack/echo/v4"
)

const LIMIT_MAX = 50000
const LIMIT_RECORDS = 100000

func (s *Server) ListRecords(c echo.Context) error {
	ctx := context.Background()

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusNotFound, nil)
	}

	container := c.Param("container")
	limit, _ := strconv.Atoi(c.QueryParam("limit"))
	offset, _ := strconv.Atoi(c.QueryParam("offset"))
	searchword, tags := parseTerm(c.QueryParam("term"))

	if limit < 1 || limit > LIMIT_MAX {
		limit = LIMIT_MAX
	}

	params := db.ListRecordsByBoxFilterPaginatedParams{
		BoxID:     id,
		Container: container,
		Data:      "%" + searchword + "%",
		Column3:   tags,
		Limit:     int32(limit),
		Offset:    int32(offset),
	}

	paramsCount := db.CountRecordsByBoxFilterParams{
		BoxID:     id,
		Container: container,
		Data:      "%" + searchword + "%",
		Column3:   tags,
	}

	records, err := s.repo.ListRecordsByBoxFilterPaginated(ctx, params)
	if err != nil && err != pgx.ErrNoRows {
		log.Printf("listing boxes failed: %v", err)
		return c.JSON(http.StatusInternalServerError, nil)
	}

	count, err := s.repo.CountRecordsByBoxFilter(ctx, paramsCount)
	if err != nil && err != pgx.ErrNoRows {
		log.Printf("listing boxes failed: %v", err)
		return c.JSON(http.StatusInternalServerError, nil)
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"count":   count,
		"records": records,
	})
}

func (s *Server) AddRecords(c echo.Context) error {
	ctx := context.Background()

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusNotFound, nil)
	}

	container := c.Param("container")

	// ensure box exists
	box, err := s.repo.GetBox(ctx, id)

	if err == pgx.ErrNoRows {
		return c.JSON(http.StatusNotFound, nil)
	}

	if err != nil {
		log.Printf("getting box failed: %v", err)
		return c.JSON(http.StatusInternalServerError, box)
	}

	if !inStringSlice(container, box.Containers) {
		if err == pgx.ErrNoRows {
			return c.JSON(http.StatusNotFound, nil)
		}
	}

	count, err := s.repo.CountRecordsByBox(ctx, id)
	if err != nil {
		log.Printf("getting box count failed: %v", err)
		return c.JSON(http.StatusInternalServerError, box)
	}

	b, err := io.ReadAll(c.Request().Body)
	if err != nil {
		return c.JSON(http.StatusBadRequest, nil)
	}

	// split tags
	tags := strings.FieldsFunc(c.QueryParam("tags"), func(c rune) bool {
		return c == ','
	})

	var added int64
	batch := &pgx.Batch{}

	for _, line := range strings.Split(string(b), "\n") {

		if line == "" {
			continue
		}

		if count+added > int64(s.recordsLimit-1) {
			break
		}

		batch.Queue(
			"INSERT INTO records (box_id, container, data, tags) VALUES ($1, $2, $3, $4)",
			id,
			container,
			line,
			tags,
		)
		added++
	}

	br := s.dbPool.SendBatch(ctx, batch)

	var affected int64
	var i int64
	for i = 0; i < added; i++ {
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

func (s *Server) CountRecords(c echo.Context) error {
	ctx := context.Background()

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusNotFound, nil)
	}

	count, err := s.repo.CountRecordsByBox(ctx, id)
	if err != nil {
		log.Printf("listing boxes failed: %v", err)
		return c.JSON(http.StatusInternalServerError, nil)
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"count": count,
		"limit": s.recordsLimit,
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
