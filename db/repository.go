package db

import (
	"context"
	"fmt"
	"log"

	"github.com/jackc/pgx/v4"
	"github.com/jackc/pgx/v4/pgxpool"
)

type qLogger struct {
}

func (l *qLogger) Log(ctx context.Context, level pgx.LogLevel, msg string, data map[string]interface{}) {
	if level == pgx.LogLevelInfo && msg == "Query" {
		fmt.Printf("[SQL] %s -- ARGS: %v\n", data["sql"], data["args"])
	}
}

func SetupRepository(dbUrl string, logQueries bool) (*Queries, *pgxpool.Pool, error) {
	pgxCfg, err := pgxpool.ParseConfig(dbUrl)
	if err != nil {
		log.Fatal(err)
	}

	pgxCfg.ConnConfig.Logger = &qLogger{}
	pgxCfg.ConnConfig.LogLevel = pgx.LogLevelWarn

	if logQueries {
		pgxCfg.ConnConfig.LogLevel = pgx.LogLevelInfo
	}

	pgxPool, err := pgxpool.ConnectConfig(context.Background(), pgxCfg)
	if err != nil {
		log.Fatal(err)
	}

	return New(pgxPool), pgxPool, nil
}
