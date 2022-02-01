package web

import (
	"context"
	"hntr/db"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/assert"
)

// create two boxes with automations and events, then try clearing one up
func TestRemoveAutomationEvents(t *testing.T) {
	assert := assert.New(t)
	ctx := context.Background()

	server, repo, dbc := MustSetupTest(t)
	defer MustCloseTest(t, dbc)

	// create two boxes
	box, err := repo.CreateBox(context.Background(), db.CreateBoxParams{
		Name:       "foo",
		Containers: []string{"a", "b"},
	})
	assert.Nil(err)

	box2, err := repo.CreateBox(context.Background(), db.CreateBoxParams{
		Name:       "foobar",
		Containers: []string{"a", "b"},
	})
	assert.Nil(err)

	automation, err := repo.CreateAutomation(context.Background(), db.CreateAutomationParams{
		BoxID:                box.ID,
		Name:                 "foo",
		Description:          "",
		SourceContainer:      "foo",
		DestinationContainer: "foo",
	})
	assert.Nil(err)

	automation2, err := repo.CreateAutomation(context.Background(), db.CreateAutomationParams{
		BoxID:                box2.ID,
		Name:                 "foo",
		Description:          "",
		SourceContainer:      "foo",
		DestinationContainer: "foo",
	})
	assert.Nil(err)

	_, err = repo.CreateAutomationEvent(ctx, db.CreateAutomationEventParams{
		BoxID:        automation.BoxID,
		AutomationID: automation.ID,
		Data:         "foo",
		Status:       "scheduled",
		AffectedRows: 0,
	})
	assert.Nil(err)

	_, err = repo.CreateAutomationEvent(ctx, db.CreateAutomationEventParams{
		BoxID:        automation2.BoxID,
		AutomationID: automation2.ID,
		Data:         "foo",
		Status:       "scheduled",
		AffectedRows: 0,
	})
	assert.Nil(err)

	req := httptest.NewRequest(http.MethodPost, "/api/box/"+box.ID.String()+"/_clear?status=scheduled", nil)
	rec := httptest.NewRecorder()
	server.ServeHTTP(rec, req)

	assert.Equal(rec.Result().StatusCode, 200)

	count, err := repo.CountAutomationEvents(ctx, box.ID)
	assert.Nil(err)
	assert.Equal(int64(0), count)

	count, err = repo.CountAutomationEvents(ctx, box2.ID)
	assert.Nil(err)
	assert.Equal(int64(1), count)
}
