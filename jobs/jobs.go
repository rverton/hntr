package jobs

import (
	"context"
	"database/sql"
	"encoding/json"
	"hntr/db"
	"log"
	"time"

	"github.com/vgarvardt/gue/v3"
	"github.com/vgarvardt/gue/v3/adapter/libpq"
	"golang.org/x/sync/errgroup"
)

type RunAutomationArgs struct {
	Automation db.Automation
	Box        db.Box
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

	// create command and run
	log.Printf("running %v with %v", args.Automation.Command, args.Data)

	return nil
}

func Init(db *sql.DB, repo *db.Queries) (*gue.Client, context.CancelFunc) {
	poolAdapter := libpq.NewConnPool(db)

	gc := gue.NewClient(poolAdapter)

	js := Jobserver{
		repo: repo,
	}

	wm := gue.WorkMap{
		"RunAutomation": js.RunAutomation,
	}

	// create a pool w/ 2 workers
	workers := gue.NewWorkerPool(gc, wm, 2, gue.WithPoolPollInterval(time.Second*1))

	ctx, shutdown := context.WithCancel(context.Background())

	// work jobs in goroutine
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
