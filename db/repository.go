package db

import (
	"bufio"
	"context"
	"errors"
	"fmt"
	"io"
	"log"
	"strings"

	"github.com/google/uuid"
	"github.com/jackc/pgconn"
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

func RecordsBatchInsert(ctx context.Context, dbPool *pgxpool.Pool, reader io.Reader, boxId uuid.UUID, container string, tags []string, quotaRemaining int64, updateDuplicate bool) int64 {
	var added int64
	batch := &pgx.Batch{}

	scanner := bufio.NewScanner(reader)

	for scanner.Scan() {

		line := strings.TrimSpace(scanner.Text())

		if added > quotaRemaining {
			break
		}

		if updateDuplicate {
			batch.Queue(
				`INSERT INTO 
                records (box_id, container, data, tags)
            VALUES 
                ($1, $2, $3, $4)
			ON CONFLICT (box_id, container, data) DO UPDATE
			SET tags = excluded.tags
            WHERE records.tags != excluded.tags`,
				boxId,
				container,
				line,
				tags,
			)
		} else {
			batch.Queue(
				`INSERT INTO 
                records (box_id, container, data, tags)
            VALUES 
                ($1, $2, $3, $4)
			ON CONFLICT (box_id, container, data) DO NOTHING`,
				boxId,
				container,
				line,
				tags,
			)
		}
		added++
	}

	br := dbPool.SendBatch(ctx, batch)

	var affected int64
	var i int64
	for i = 0; i < added; i++ {
		ct, err := br.Exec()
		if err != nil {
			var pgErr *pgconn.PgError
			if errors.As(err, &pgErr) {
				if pgErr.Code != "23505" {
					log.Printf("unable to exec batch insert: %v", pgErr)
				}
			}
		}

		affected += ct.RowsAffected()
	}

	if err := br.Close(); err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) {
			if pgErr.Code != "23505" {
				log.Printf("unable to exec batch insert: %v", pgErr)
			}
		}
	}

	return affected
}
