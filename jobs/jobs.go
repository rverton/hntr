package jobs

import (
	"context"
	"encoding/json"
	"fmt"
	"hntr/db"
	"log"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v4"
	"github.com/jackc/pgx/v4/pgxpool"
	"github.com/vgarvardt/gue/v3"
	"github.com/vgarvardt/gue/v3/adapter/pgxv4"
	"golang.org/x/sync/errgroup"
)

const colorBlue = "\033[34m"
const colorReset = "\033[0m"

type qLogger struct {
}

func (l *qLogger) Log(ctx context.Context, level pgx.LogLevel, msg string, data map[string]interface{}) {
	fmt.Printf("%s[SQL] `%s` %+v%s\n",
		colorBlue,
		data["sql"],
		data["args"],
		colorReset,
	)
}

var finishedJobsLog = func(ctx context.Context, j *gue.Job, err error) {
	if err != nil {
		return
	}

	if _, err := j.Tx().Exec(
		ctx,
		"INSERT INTO gue_finished_jobs (job_id, queue, job_type, args, error_count, last_error, finished_at) VALUES ($1, $2, $3, $4, $5, $6, now())",
		j.ID,
		j.Queue,
		j.Type,
		json.RawMessage(j.Args),
		j.ErrorCount,
		j.LastError.String,
	); err != nil {
		log.Printf("error saving job log: %v", err)
	}
}

type RunAutomationArgs struct {
	JobID      uuid.UUID
	Automation db.Automation
	Data       string
}

type Jobserver struct {
	repo *db.Queries
}

func (js *Jobserver) RunAutomation(ctx context.Context, j *gue.Job) error {
	var args RunAutomationArgs
	if err := json.Unmarshal(j.Args, &args); err != nil {
		return err
	}

	if err := js.repo.UpdateAutomationEventStatusStarted(ctx, args.JobID); err != nil {
		log.Printf("error updating job status: %v", err)
	}

	// create command and run
	log.Printf("running %v with %v", args.Automation.Command, args.Data)

	if err := js.repo.UpdateAutomationEventStatusFinished(ctx, args.JobID); err != nil {
		log.Printf("error updating job status: %v", err)
	}

	return nil
}

func Init(dbUrl string, repo *db.Queries) (*gue.Client, context.CancelFunc) {
	pgxCfg, err := pgxpool.ParseConfig(dbUrl)
	if err != nil {
		log.Fatal(err)
	}

	pgxCfg.ConnConfig.Logger = &qLogger{}
	pgxCfg.ConnConfig.LogLevel = pgx.LogLevelWarn // switch to LogLevelInfo for query log output

	pgxPool, err := pgxpool.ConnectConfig(context.Background(), pgxCfg)
	if err != nil {
		log.Fatal(err)
	}

	poolAdapter := pgxv4.NewConnPool(pgxPool)
	gc := gue.NewClient(poolAdapter)

	js := Jobserver{
		repo: repo,
	}

	wm := gue.WorkMap{
		"RunAutomation": js.RunAutomation,
	}

	// create a pool w/ 2 workers
	workers := gue.NewWorkerPool(gc, wm, 2, gue.WithPoolPollInterval(time.Second*1), gue.WithPoolHooksJobDone(finishedJobsLog))

	ctx, shutdown := context.WithCancel(context.Background())

	g, gctx := errgroup.WithContext(ctx)
	g.Go(func() error {
		err := workers.Run(gctx)
		if err != nil {
			// In a real-world applications, use a better way to shut down
			// application on unrecoverable error. E.g. fx.Shutdowner from
			// go.uber.org/fx module.
			log.Fatal(err)
		}
		return err
	})

	return gc, shutdown
}
