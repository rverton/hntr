package db

import (
	"context"
	"fmt"
	"log"

	"github.com/jackc/pgx/v4"
	"github.com/jackc/pgx/v4/pgxpool"
)

const colorBlue = "\033[34m"
const colorReset = "\033[0m"

type qLogger struct {
}

func (l *qLogger) Log(ctx context.Context, level pgx.LogLevel, msg string, data map[string]interface{}) {
	if _, ok := data["sql"]; !ok {
		return
	}

	fmt.Printf("%s[SQL] `%s` %+v%s\n",
		colorBlue,
		data["sql"],
		data["args"],
		colorReset,
	)
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
