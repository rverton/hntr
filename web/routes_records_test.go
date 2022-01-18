package web

import (
	"context"
	"encoding/json"
	"fmt"
	"hntr/db"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestGetRecords(t *testing.T) {
	assert := assert.New(t)

	server, repo, dbc := MustSetupTest(t)
	defer MustCloseTest(t, dbc)

	box, err := repo.CreateBox(context.Background(), db.CreateBoxParams{
		Name:       "Testbox",
		Containers: []string{"hostnames", "urls"},
	})
	assert.Nil(err)

	for i := 0; i < 10; i++ {
		err = repo.CreateRecord(context.Background(), db.CreateRecordParams{
			BoxID:     box.ID,
			Data:      fmt.Sprintf("foo_%v", i),
			Container: "hostnames",
			Tags:      []string{"a", "b"},
		})
		assert.Nil(err)
	}

	err = repo.CreateRecord(context.Background(), db.CreateRecordParams{
		BoxID:     box.ID,
		Data:      "foo_tag",
		Container: "hostnames",
		Tags:      []string{"single_tag"},
	})
	assert.Nil(err)

	t.Run("list all", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/box/"+box.ID.String()+"/hostnames", nil)
		rec := httptest.NewRecorder()
		server.ServeHTTP(rec, req)

		assert.Equal(rec.Result().StatusCode, 200)

		type Data struct {
			Records []db.Record `json:"records"`
			Count   int         `json:"count"`
		}
		d := new(Data)
		err = json.Unmarshal(rec.Body.Bytes(), &d)
		assert.Nil(err)

		assert.Len(d.Records, 11)
		assert.Equal(11, d.Count)
		assert.Equal("foo_0", d.Records[0].Data)
		assert.Equal([]string{"a", "b"}, d.Records[0].Tags)
	})

	t.Run("list by tag", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/box/"+box.ID.String()+"/hostnames?term=tag:single_tag", nil)
		rec := httptest.NewRecorder()
		server.ServeHTTP(rec, req)

		assert.Equal(rec.Result().StatusCode, 200)

		type Data struct {
			Records []db.Record `json:"records"`
			Count   int         `json:"count"`
		}
		d := new(Data)
		err = json.Unmarshal(rec.Body.Bytes(), &d)
		assert.Nil(err)

		assert.Len(d.Records, 1)
	})

	t.Run("list by searchword", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/box/"+box.ID.String()+"/hostnames?term=foo_3", nil)
		rec := httptest.NewRecorder()
		server.ServeHTTP(rec, req)

		assert.Equal(rec.Result().StatusCode, 200)

		type Data struct {
			Records []db.Record `json:"records"`
			Count   int         `json:"count"`
		}
		d := new(Data)
		err = json.Unmarshal(rec.Body.Bytes(), &d)
		assert.Nil(err)

		assert.Len(d.Records, 1)
	})
}

func TestAddRecords(t *testing.T) {
	assert := assert.New(t)

	server, repo, dbc := MustSetupTest(t)
	defer MustCloseTest(t, dbc)

	box, err := repo.CreateBox(context.Background(), db.CreateBoxParams{
		Name:       "Testbox",
		Containers: []string{"hostnames", "urls"},
	})
	assert.Nil(err)

	t.Run("add a single record", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodPost, "/api/box/"+box.ID.String()+"/hostnames?tags=foo,bar", strings.NewReader("foobar"))
		rec := httptest.NewRecorder()
		server.ServeHTTP(rec, req)

		assert.Equal(rec.Result().StatusCode, 200)

		records, err := repo.ListRecordsByBoxFilter(context.Background(), db.ListRecordsByBoxFilterParams{
			BoxID:     box.ID,
			Container: "hostnames",
			Column3:   []string{},
			Data:      "%%",
		})
		assert.Nil(err)

		assert.Len(records, 1)
		assert.Equal("foobar", records[0].Data)
		assert.Equal([]string{"foo", "bar"}, records[0].Tags)
	})

	t.Run("add two records", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodPost, "/api/box/"+box.ID.String()+"/urls", strings.NewReader("foobar\nbarfoo"))
		rec := httptest.NewRecorder()
		server.ServeHTTP(rec, req)

		assert.Equal(rec.Result().StatusCode, 200)

		records, err := repo.ListRecordsByBoxFilter(context.Background(), db.ListRecordsByBoxFilterParams{
			BoxID:     box.ID,
			Container: "urls",
			Column3:   []string{},
			Data:      "%%",
		})
		assert.Nil(err)

		assert.Len(records, 2)
	})
}

// TODO: CountRecords
// TODO: UpdateRecords
// TODO: DeleteRecords
