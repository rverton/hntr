package web

import (
	"bytes"
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

func TestIndex(t *testing.T) {
	assert := assert.New(t)

	server, _, dbc := MustSetupTest(t)
	defer MustCloseTest(t, dbc)

	req := httptest.NewRequest(http.MethodGet, "/", nil)
	rec := httptest.NewRecorder()
	server.ServeHTTP(rec, req)

	var data []db.Box
	err := json.Unmarshal(rec.Body.Bytes(), &data)
	assert.Nil(err)

	assert.Equal(http.StatusOK, rec.Code)
	assert.Len(data, 0)
}
