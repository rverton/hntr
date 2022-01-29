// Code generated by sqlc. DO NOT EDIT.

package db

import (
	"context"

	"github.com/google/uuid"
)

type Querier interface {
	CountRecordsByBox(ctx context.Context, boxID uuid.UUID) (int64, error)
	CountRecordsByBoxFilter(ctx context.Context, arg CountRecordsByBoxFilterParams) (int64, error)
	CreateAutomation(ctx context.Context, arg CreateAutomationParams) (Automation, error)
	CreateAutomationEvent(ctx context.Context, arg CreateAutomationEventParams) (AutomationEvent, error)
	CreateBox(ctx context.Context, arg CreateBoxParams) (Box, error)
	CreateRecord(ctx context.Context, arg CreateRecordParams) error
	DeleteAutomation(ctx context.Context, id uuid.UUID) error
	DeleteRecords(ctx context.Context, arg DeleteRecordsParams) error
	DequeueAutomationEvents(ctx context.Context, arg DequeueAutomationEventsParams) ([]AutomationEvent, error)
	GetAutomation(ctx context.Context, id uuid.UUID) (Automation, error)
	GetAutomationEvent(ctx context.Context, id uuid.UUID) (AutomationEvent, error)
	GetAutomationEventCounts(ctx context.Context, boxID uuid.UUID) ([]GetAutomationEventCountsRow, error)
	GetBox(ctx context.Context, id uuid.UUID) (Box, error)
	ListAutomationEvents(ctx context.Context, arg ListAutomationEventsParams) ([]AutomationEvent, error)
	ListAutomationLibrary(ctx context.Context) ([]ListAutomationLibraryRow, error)
	ListAutomations(ctx context.Context, boxID uuid.UUID) ([]Automation, error)
	ListBoxes(ctx context.Context) ([]Box, error)
	ListRecordsByBoxFilter(ctx context.Context, arg ListRecordsByBoxFilterParams) ([]Record, error)
	ListRecordsByBoxFilterPaginated(ctx context.Context, arg ListRecordsByBoxFilterPaginatedParams) ([]Record, error)
	UpdateAutomation(ctx context.Context, arg UpdateAutomationParams) error
	UpdateAutomationEventStatus(ctx context.Context, arg UpdateAutomationEventStatusParams) error
	UpdateAutomationEventStatusFinished(ctx context.Context, arg UpdateAutomationEventStatusFinishedParams) error
	UpdateBox(ctx context.Context, arg UpdateBoxParams) error
	UpdateLastAccessed(ctx context.Context, id uuid.UUID) error
	UpdateRecordTags(ctx context.Context, arg UpdateRecordTagsParams) error
}

var _ Querier = (*Queries)(nil)
