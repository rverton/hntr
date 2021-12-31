// Code generated by sqlc. DO NOT EDIT.
// source: hostnames.sql

package db

import (
	"context"

	"github.com/google/uuid"
	"github.com/lib/pq"
)

const countHostnamesByBoxFilter = `-- name: CountHostnamesByBoxFilter :one
SELECT count(*) from hostnames WHERE box_id = $1 AND hostname like $2 AND $3::text[] <@ tags
`

type CountHostnamesByBoxFilterParams struct {
	BoxID    uuid.UUID `json:"box_id"`
	Hostname string    `json:"hostname"`
	Column3  []string  `json:"column_3"`
}

func (q *Queries) CountHostnamesByBoxFilter(ctx context.Context, arg CountHostnamesByBoxFilterParams) (int64, error) {
	row := q.db.QueryRowContext(ctx, countHostnamesByBoxFilter, arg.BoxID, arg.Hostname, pq.Array(arg.Column3))
	var count int64
	err := row.Scan(&count)
	return count, err
}

const createHostname = `-- name: CreateHostname :exec
INSERT INTO hostnames (hostname, tags, box_id, source) VALUES ($1, $2, $3, $4) RETURNING id, hostname, box_id, tags, source, created_at
`

type CreateHostnameParams struct {
	Hostname string    `json:"hostname"`
	Tags     []string  `json:"tags"`
	BoxID    uuid.UUID `json:"box_id"`
	Source   string    `json:"source"`
}

func (q *Queries) CreateHostname(ctx context.Context, arg CreateHostnameParams) error {
	_, err := q.db.ExecContext(ctx, createHostname,
		arg.Hostname,
		pq.Array(arg.Tags),
		arg.BoxID,
		arg.Source,
	)
	return err
}

const listHostnamesByBox = `-- name: ListHostnamesByBox :many
SELECT id, hostname, box_id, tags, source, created_at from hostnames WHERE box_id = $1 ORDER BY created_at DESC
`

func (q *Queries) ListHostnamesByBox(ctx context.Context, boxID uuid.UUID) ([]Hostname, error) {
	rows, err := q.db.QueryContext(ctx, listHostnamesByBox, boxID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	items := []Hostname{}
	for rows.Next() {
		var i Hostname
		if err := rows.Scan(
			&i.ID,
			&i.Hostname,
			&i.BoxID,
			pq.Array(&i.Tags),
			&i.Source,
			&i.CreatedAt,
		); err != nil {
			return nil, err
		}
		items = append(items, i)
	}
	if err := rows.Close(); err != nil {
		return nil, err
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return items, nil
}

const listHostnamesByBoxFilter = `-- name: ListHostnamesByBoxFilter :many
SELECT id, hostname, box_id, tags, source, created_at from hostnames WHERE box_id = $1 AND hostname like $2 AND $3::text[] <@ tags ORDER BY created_at DESC
`

type ListHostnamesByBoxFilterParams struct {
	BoxID    uuid.UUID `json:"box_id"`
	Hostname string    `json:"hostname"`
	Column3  []string  `json:"column_3"`
}

func (q *Queries) ListHostnamesByBoxFilter(ctx context.Context, arg ListHostnamesByBoxFilterParams) ([]Hostname, error) {
	rows, err := q.db.QueryContext(ctx, listHostnamesByBoxFilter, arg.BoxID, arg.Hostname, pq.Array(arg.Column3))
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	items := []Hostname{}
	for rows.Next() {
		var i Hostname
		if err := rows.Scan(
			&i.ID,
			&i.Hostname,
			&i.BoxID,
			pq.Array(&i.Tags),
			&i.Source,
			&i.CreatedAt,
		); err != nil {
			return nil, err
		}
		items = append(items, i)
	}
	if err := rows.Close(); err != nil {
		return nil, err
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return items, nil
}
