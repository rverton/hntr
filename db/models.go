// Code generated by sqlc. DO NOT EDIT.

package db

import (
	"database/sql"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgtype"
)

type Automation struct {
	ID               uuid.UUID `json:"id"`
	Name             string    `json:"name"`
	BoxID            uuid.UUID `json:"box_id"`
	Command          string    `json:"command"`
	SourceTable      string    `json:"source_table"`
	SourceTags       []string  `json:"source_tags"`
	DestinationTable string    `json:"destination_table"`
	DestinationTags  []string  `json:"destination_tags"`
	CreatedAt        time.Time `json:"created_at"`
}

type Box struct {
	ID        uuid.UUID `json:"id"`
	Name      string    `json:"name"`
	CreatedAt time.Time `json:"created_at"`
}

// 1
type GueJob struct {
	JobID      int64          `json:"job_id"`
	Priority   int16          `json:"priority"`
	RunAt      time.Time      `json:"run_at"`
	JobType    string         `json:"job_type"`
	Args       pgtype.JSON    `json:"args"`
	ErrorCount int32          `json:"error_count"`
	LastError  sql.NullString `json:"last_error"`
	Queue      string         `json:"queue"`
	CreatedAt  time.Time      `json:"created_at"`
	UpdatedAt  time.Time      `json:"updated_at"`
}

type Hostname struct {
	ID        int32     `json:"id"`
	Hostname  string    `json:"hostname"`
	BoxID     uuid.UUID `json:"box_id"`
	Tags      []string  `json:"tags"`
	Source    string    `json:"source"`
	CreatedAt time.Time `json:"created_at"`
}
