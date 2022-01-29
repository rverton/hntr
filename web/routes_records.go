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
)

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

	// TODO: retrieve box and check if container exists

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

	if err != nil {
		if err == pgx.ErrNoRows {
			return c.JSON(http.StatusNotFound, nil)
		}

		log.Printf("getting box failed: %v", err)
		return c.JSON(http.StatusInternalServerError, box)
	}

	if !inStringSlice(container, box.Containers) {
		return c.JSON(http.StatusNotFound, nil)
	}

	count, err := s.repo.CountRecordsByBox(ctx, id)
	if err != nil {
		log.Printf("getting box count failed: %v", err)
		return c.JSON(http.StatusInternalServerError, box)
	}

	// split tags
	tags := strings.FieldsFunc(c.QueryParam("tags"), func(c rune) bool {
		return c == ','
	})

	type AddRecordTags struct {
		Tags []string `json:"tags" validate:"required,max=10,dive,max=50"`
	}

	if err = c.Validate(AddRecordTags{Tags: tags}); err != nil {
		errors := err.(validator.ValidationErrors)
		firstError := errors[0]

		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": fmt.Sprintf("%s: %s", firstError.Field(), validationErrorMsg(firstError)),
		})
	}

	tags = cleanTags(tags)

	if len(tags) > TAGS_MAX {
		return c.JSON(http.StatusNotAcceptable, map[string]string{
			"error": fmt.Sprintf("too many tags. MAX_TAGS=%v", TAGS_MAX),
		})
	}

	updateDuplicate := false
	if c.QueryParam("update") != "" {
		updateDuplicate = true
	}

	affected := db.RecordsBatchInsert(
		ctx,
		s.dbPool,
		c.Request().Body,
		id,
		container,
		tags,
		int64(s.recordsLimit)-count-1,
		updateDuplicate,
	)

	return c.JSON(http.StatusOK, map[string]interface{}{
		"changed": affected,
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

func (s *Server) UpdateRecords(c echo.Context) error {
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

	type UpdateRecords struct {
		Records []string `json:"records" validate:"required,min=1"`
		Tags    []string `json:"tags" validate:"required,max=10,dive,max=50"`
	}

	updateRecords := new(UpdateRecords)
	if err = c.Bind(updateRecords); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "invalid data",
		})
	}

	if err = c.Validate(updateRecords); err != nil {
		errors := err.(validator.ValidationErrors)

		firstError := errors[0]

		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": fmt.Sprintf("%s: %s", firstError.Field(), validationErrorMsg(firstError)),
		})
	}

	if err = s.repo.UpdateRecordTags(ctx, db.UpdateRecordTagsParams{
		Tags:      cleanTags(updateRecords.Tags),
		BoxID:     box.ID,
		Container: container,
		Column4:   updateRecords.Records,
	}); err != nil {
		log.Printf("getting box failed: %v", err)
		return c.JSON(http.StatusInternalServerError, box)
	}

	return c.JSON(http.StatusOK, nil)
}

func (s *Server) DeleteRecords(c echo.Context) error {
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

	type DeleteRecords struct {
		Records []string `json:"records" validate:"required,min=1"`
	}

	deleteRecords := new(DeleteRecords)
	if err = c.Bind(deleteRecords); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "invalid data",
		})
	}

	if err = c.Validate(deleteRecords); err != nil {
		errors := err.(validator.ValidationErrors)

		firstError := errors[0]

		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": fmt.Sprintf("%s: %s", firstError.Field(), validationErrorMsg(firstError)),
		})
	}

	if err = s.repo.DeleteRecords(ctx, db.DeleteRecordsParams{
		BoxID:     box.ID,
		Container: container,
		Column3:   deleteRecords.Records,
	}); err != nil {
		log.Printf("deleting records failed: %v", err)
		return c.JSON(http.StatusInternalServerError, box)
	}

	return c.JSON(http.StatusOK, nil)
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

func cleanTags(tags []string) []string {
	cleaned := make([]string, 0)
	for _, t := range tags {
		if t == "" {
			continue
		}
		cleaned = append(cleaned, t)
	}

	return cleaned
}
