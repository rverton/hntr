// Code generated by sqlc. DO NOT EDIT.

package db

import (
	"time"

	"github.com/google/uuid"
)

type Box struct {
	ID        uuid.UUID `json:"id"`
	Name      string    `json:"name"`
	CreatedAt time.Time `json:"created_at"`
}

type Hostname struct {
	ID        uuid.UUID `json:"id"`
	Hostname  string    `json:"hostname"`
	BoxID     uuid.UUID `json:"box_id"`
	CreatedAt time.Time `json:"created_at"`
}
