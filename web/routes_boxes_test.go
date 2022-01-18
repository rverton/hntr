package web

import (
	"bytes"
	"context"
	"encoding/json"
	"hntr/db"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/assert"
)

func decode(body *bytes.Buffer) interface{} {
	var data interface{}

	if err := json.Unmarshal(body.Bytes(), &data); err != nil {
		panic(err)
	}

	return data
}

func TestCreate(t *testing.T) {
	assert := assert.New(t)

	server, _, dbc := MustSetupTest(t)
	defer MustCloseTest(t, dbc)

	req := httptest.NewRequest(http.MethodPost, "/api/box/create", nil)
	rec := httptest.NewRecorder()
	server.ServeHTTP(rec, req)

	var data db.Box
	err := json.Unmarshal(rec.Body.Bytes(), &data)
	assert.Nil(err)

	assert.Equal(http.StatusOK, rec.Code)
	assert.Equal("Unnamed Box", data.Name)
}

func TestGetBox(t *testing.T) {
	assert := assert.New(t)

	server, repo, dbc := MustSetupTest(t)
	defer MustCloseTest(t, dbc)

	box, err := repo.CreateBox(context.Background(), db.CreateBoxParams{
		Name:       "foo",
		Containers: []string{"a", "b"},
	})
	assert.Nil(err)

	req := httptest.NewRequest(http.MethodGet, "/api/box/"+box.ID.String(), nil)
	rec := httptest.NewRecorder()
	server.ServeHTTP(rec, req)

	assert.Equal(rec.Result().StatusCode, 200)

	var data db.Box
	err = json.Unmarshal(rec.Body.Bytes(), &data)
	assert.Nil(err)

	assert.Equal("foo", data.Name)
	assert.Len(data.Containers, 2)
}

func TestUpdateBox(t *testing.T) {
	assert := assert.New(t)

	server, repo, dbc := MustSetupTest(t)
	defer MustCloseTest(t, dbc)

	box, err := repo.CreateBox(context.Background(), db.CreateBoxParams{
		Name:       "foo",
		Containers: []string{"aa", "bb"},
	})
	assert.Nil(err)

	t.Run("minimum container name len", func(t *testing.T) {
		data := UpdateBox{
			Name:       "bar",
			Containers: []string{"a"},
		}
		dataJson, _ := json.Marshal(data)

		req := httptest.NewRequest(http.MethodPut, "/api/box/"+box.ID.String(), bytes.NewReader(dataJson))
		req.Header.Set("Content-Type", "application/json")

		rec := httptest.NewRecorder()
		server.ServeHTTP(rec, req)

		assert.Equal(rec.Result().StatusCode, 400)
	})

	t.Run("update name and container", func(t *testing.T) {
		data := UpdateBox{
			Name:       "bar",
			Containers: []string{"abc"},
		}
		dataJson, _ := json.Marshal(data)

		req := httptest.NewRequest(http.MethodPut, "/api/box/"+box.ID.String(), bytes.NewReader(dataJson))
		req.Header.Set("Content-Type", "application/json")

		rec := httptest.NewRecorder()
		server.ServeHTTP(rec, req)

		assert.Equal(rec.Result().StatusCode, 200)

		boxUpdated, err := repo.GetBox(context.Background(), box.ID)
		assert.Nil(err)

		assert.Equal("bar", boxUpdated.Name)
		assert.Equal([]string{"abc"}, boxUpdated.Containers)
	})
}
