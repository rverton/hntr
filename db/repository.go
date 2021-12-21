package db

import (
	"database/sql"
	"fmt"

	_ "github.com/lib/pq"
)

func SetupRepository(dbserver, dbname, dbuser, dbpass string) (*Queries, *sql.DB, error) {
	dbc, err := sql.Open("postgres", fmt.Sprintf("user=%v password=%v dbname=%v sslmode=disable", dbuser, dbpass, dbname))
	if err != nil {
		return nil, nil, err
	}

	return New(dbc), dbc, nil
}
