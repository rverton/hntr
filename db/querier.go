// Code generated by sqlc. DO NOT EDIT.

package db

import (
	"context"

	"github.com/google/uuid"
)

type Querier interface {
	CountRecordsByBoxFilter(ctx context.Context, arg CountRecordsByBoxFilterParams) (int64, error)
	CreateAutomation(ctx context.Context, arg CreateAutomationParams) (Automation, error)
	CreateAutomationEvent(ctx context.Context, arg CreateAutomationEventParams) (AutomationEvent, error)
	CreateBox(ctx context.Context, arg CreateBoxParams) (Box, error)
	CreateRecord(ctx context.Context, arg CreateRecordParams) error
	GetAutomation(ctx context.Context, id uuid.UUID) (Automation, error)
	GetBox(ctx context.Context, id uuid.UUID) (Box, error)
	ListAutomationEvents(ctx context.Context, automationID uuid.UUID) ([]AutomationEvent, error)
	ListAutomationLibrary(ctx context.Context) ([]ListAutomationLibraryRow, error)
	ListAutomations(ctx context.Context, boxID uuid.UUID) ([]Automation, error)
	ListBoxes(ctx context.Context) ([]Box, error)
	ListRecordsByBoxFilter(ctx context.Context, arg ListRecordsByBoxFilterParams) ([]Record, error)
	ListRecordsByBoxFilterPaginated(ctx context.Context, arg ListRecordsByBoxFilterPaginatedParams) ([]Record, error)
	UpdateAutomationEventStatusFinished(ctx context.Context, id uuid.UUID) error
	UpdateAutomationEventStatusStarted(ctx context.Context, id uuid.UUID) error
	UpdateBox(ctx context.Context, arg UpdateBoxParams) error
}

var _ Querier = (*Queries)(nil)
