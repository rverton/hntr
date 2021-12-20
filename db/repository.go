package db

import (
	"database/sql"
	"fmt"
)

func SetupRepository(dbserver, dbname, dbuser, dbpass string) (*Queries, error) {
	dbc, err := sql.Open("postgres", fmt.Sprintf("user=%v password=%v dbname=%v sslmode=disable", dbuser, dbpass, dbname))
	if err != nil {
		return nil, err
	}

	return New(dbc), nil
}
