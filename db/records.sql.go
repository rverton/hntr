// Code generated by sqlc. DO NOT EDIT.
// source: records.sql

package db

import (
	"context"

	"github.com/google/uuid"
)

const countRecordsByBoxFilter = `-- name: CountRecordsByBoxFilter :one
SELECT count(*) FROM records WHERE 
    box_id = $1 AND
    container = $2 AND
    $3::varchar[] <@ tags AND
    data LIKE $4
`

type CountRecordsByBoxFilterParams struct {
	BoxID     uuid.UUID `json:"box_id"`
	Container string    `json:"container"`
	Column3   []string  `json:"column_3"`
	Data      string    `json:"data"`
}

func (q *Queries) CountRecordsByBoxFilter(ctx context.Context, arg CountRecordsByBoxFilterParams) (int64, error) {
	row := q.db.QueryRow(ctx, countRecordsByBoxFilter,
		arg.BoxID,
		arg.Container,
		arg.Column3,
		arg.Data,
	)
	var count int64
	err := row.Scan(&count)
	return count, err
}

const createRecord = `-- name: CreateRecord :exec
INSERT INTO records (data, tags, box_id, container) VALUES ($1, $2, $3, $4)
`

type CreateRecordParams struct {
	Data      string    `json:"data"`
	Tags      []string  `json:"tags"`
	BoxID     uuid.UUID `json:"box_id"`
	Container string    `json:"container"`
}

func (q *Queries) CreateRecord(ctx context.Context, arg CreateRecordParams) error {
	_, err := q.db.Exec(ctx, createRecord,
		arg.Data,
		arg.Tags,
		arg.BoxID,
		arg.Container,
	)
	return err
}

const listRecordsByBoxFilter = `-- name: ListRecordsByBoxFilter :many
SELECT data, tags, box_id, container, created_at FROM records WHERE 
    box_id = $1 AND
    container = $2 AND
    $3::varchar[] <@ tags AND
    data LIKE $4 
ORDER BY created_at DESC
`

type ListRecordsByBoxFilterParams struct {
	BoxID     uuid.UUID `json:"box_id"`
	Container string    `json:"container"`
	Column3   []string  `json:"column_3"`
	Data      string    `json:"data"`
}

func (q *Queries) ListRecordsByBoxFilter(ctx context.Context, arg ListRecordsByBoxFilterParams) ([]Record, error) {
	rows, err := q.db.Query(ctx, listRecordsByBoxFilter,
		arg.BoxID,
		arg.Container,
		arg.Column3,
		arg.Data,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	items := []Record{}
	for rows.Next() {
		var i Record
		if err := rows.Scan(
			&i.Data,
			&i.Tags,
			&i.BoxID,
			&i.Container,
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

const listRecordsByBoxFilterPaginated = `-- name: ListRecordsByBoxFilterPaginated :many
SELECT data, tags, box_id, container, created_at FROM records WHERE 
    box_id = $1 AND
    container = $2 AND
    $3::varchar[] <@ tags AND
    data LIKE $4
ORDER BY created_at DESC
LIMIT $5 OFFSET $6
`

type ListRecordsByBoxFilterPaginatedParams struct {
	BoxID     uuid.UUID `json:"box_id"`
	Container string    `json:"container"`
	Column3   []string  `json:"column_3"`
	Data      string    `json:"data"`
	Limit     int32     `json:"limit"`
	Offset    int32     `json:"offset"`
}

func (q *Queries) ListRecordsByBoxFilterPaginated(ctx context.Context, arg ListRecordsByBoxFilterPaginatedParams) ([]Record, error) {
	rows, err := q.db.Query(ctx, listRecordsByBoxFilterPaginated,
		arg.BoxID,
		arg.Container,
		arg.Column3,
		arg.Data,
		arg.Limit,
		arg.Offset,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	items := []Record{}
	for rows.Next() {
		var i Record
		if err := rows.Scan(
			&i.Data,
			&i.Tags,
			&i.BoxID,
			&i.Container,
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