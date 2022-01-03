// Code generated by sqlc. DO NOT EDIT.
// source: automations.sql

package db

import (
	"context"

	"github.com/google/uuid"
)

const createAutomationEvent = `-- name: CreateAutomationEvent :one
INSERT INTO automation_events (box_id, automation_id, data, status, unique_results) VALUES ($1, $2, $3, $4, $5) RETURNING id, box_id, automation_id, status, data, unique_results, created_at, finished_at
`

type CreateAutomationEventParams struct {
	BoxID         uuid.UUID `json:"box_id"`
	AutomationID  uuid.UUID `json:"automation_id"`
	Data          string    `json:"data"`
	Status        string    `json:"status"`
	UniqueResults int32     `json:"unique_results"`
}

func (q *Queries) CreateAutomationEvent(ctx context.Context, arg CreateAutomationEventParams) (AutomationEvent, error) {
	row := q.db.QueryRow(ctx, createAutomationEvent,
		arg.BoxID,
		arg.AutomationID,
		arg.Data,
		arg.Status,
		arg.UniqueResults,
	)
	var i AutomationEvent
	err := row.Scan(
		&i.ID,
		&i.BoxID,
		&i.AutomationID,
		&i.Status,
		&i.Data,
		&i.UniqueResults,
		&i.CreatedAt,
		&i.FinishedAt,
	)
	return i, err
}

const getAutomation = `-- name: GetAutomation :one
SELECT id, name, box_id, command, source_table, source_tags, destination_table, destination_tags, created_at FROM automations WHERE id = $1 LIMIT 1
`

func (q *Queries) GetAutomation(ctx context.Context, id uuid.UUID) (Automation, error) {
	row := q.db.QueryRow(ctx, getAutomation, id)
	var i Automation
	err := row.Scan(
		&i.ID,
		&i.Name,
		&i.BoxID,
		&i.Command,
		&i.SourceTable,
		&i.SourceTags,
		&i.DestinationTable,
		&i.DestinationTags,
		&i.CreatedAt,
	)
	return i, err
}

const listAutomationEvents = `-- name: ListAutomationEvents :many
SELECT id, box_id, automation_id, status, data, unique_results, created_at, finished_at FROM automation_events WHERE automation_id = $1 ORDER BY created_at DESC
`

func (q *Queries) ListAutomationEvents(ctx context.Context, automationID uuid.UUID) ([]AutomationEvent, error) {
	rows, err := q.db.Query(ctx, listAutomationEvents, automationID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	items := []AutomationEvent{}
	for rows.Next() {
		var i AutomationEvent
		if err := rows.Scan(
			&i.ID,
			&i.BoxID,
			&i.AutomationID,
			&i.Status,
			&i.Data,
			&i.UniqueResults,
			&i.CreatedAt,
			&i.FinishedAt,
		); err != nil {
			return nil, err
		}
		items = append(items, i)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return items, nil
}

const listAutomations = `-- name: ListAutomations :many
SELECT id, name, box_id, command, source_table, source_tags, destination_table, destination_tags, created_at FROM automations WHERE box_id = $1
`

func (q *Queries) ListAutomations(ctx context.Context, boxID uuid.UUID) ([]Automation, error) {
	rows, err := q.db.Query(ctx, listAutomations, boxID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	items := []Automation{}
	for rows.Next() {
		var i Automation
		if err := rows.Scan(
			&i.ID,
			&i.Name,
			&i.BoxID,
			&i.Command,
			&i.SourceTable,
			&i.SourceTags,
			&i.DestinationTable,
			&i.DestinationTags,
			&i.CreatedAt,
		); err != nil {
			return nil, err
		}
		items = append(items, i)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return items, nil
}

const updateAutomationEventStatusFinished = `-- name: UpdateAutomationEventStatusFinished :exec
UPDATE automation_events SET status = 'finished', finished_at = now() where id = $1
`

func (q *Queries) UpdateAutomationEventStatusFinished(ctx context.Context, id uuid.UUID) error {
	_, err := q.db.Exec(ctx, updateAutomationEventStatusFinished, id)
	return err
}

const updateAutomationEventStatusStarted = `-- name: UpdateAutomationEventStatusStarted :exec
UPDATE automation_events SET status = 'started' where id = $1
`

func (q *Queries) UpdateAutomationEventStatusStarted(ctx context.Context, id uuid.UUID) error {
	_, err := q.db.Exec(ctx, updateAutomationEventStatusStarted, id)
	return err
}
