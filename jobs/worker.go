package jobs

import (
	"context"
	"encoding/json"
	"fmt"
	"hntr/db"
	"log"
	"os/exec"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v4/pgxpool"
	"github.com/vgarvardt/gue/v3"
	"gopkg.in/alessio/shellescape.v1"
)

type RunAutomationArgs struct {
	JobID      uuid.UUID
	Automation db.Automation
	Data       string
}

type Jobserver struct {
	repo   *db.Queries
	dbPool *pgxpool.Pool
}

const REPLACE = "{data}"

var JOB_MAX_TIME = 60 * time.Second

func executeCommand(ctx context.Context, jobArgs RunAutomationArgs, deadline time.Duration, dbPool *pgxpool.Pool, quotaLimit int64) (chan int64, error) {

	results := make(chan int64)

	ctxTimed, cancel := context.WithTimeout(ctx, deadline)
	defer cancel()

	quoted := shellescape.Quote(jobArgs.Data)
	quotedCmd := strings.Replace(jobArgs.Automation.Command, REPLACE, quoted, -1)

	cmd := exec.CommandContext(ctxTimed, "bash", "-c", quotedCmd)
	stdout, err := cmd.StdoutPipe()
	if err != nil {
		return results, fmt.Errorf("error updating job status: %v", err)
	}

	go func() {

		affected := db.RecordsBatchInsert(
			ctx,
			dbPool,
			stdout,
			jobArgs.Automation.BoxID,
			jobArgs.Automation.DestinationContainer,
			jobArgs.Automation.DestinationTags,
			quotaLimit,
		)

		results <- affected
	}()

	return results, cmd.Run()
}

func (js *Jobserver) RunAutomation(ctx context.Context, j *gue.Job) error {
	var args RunAutomationArgs
	if err := json.Unmarshal(j.Args, &args); err != nil {
		return err
	}

	if err := js.repo.UpdateAutomationEventStatus(ctx, db.UpdateAutomationEventStatusParams{
		Status: "started",
		ID:     args.JobID,
	}); err != nil {
		log.Printf("error updating job status: %v", err)
		return nil
	}

	results, err := executeCommand(ctx, args, JOB_MAX_TIME, js.dbPool, 10)

	affectedRows := int32(<-results)

	if err != nil {
		if err.Error() == "signal: killed" {
			if err := js.repo.UpdateAutomationEventStatusFinished(ctx, db.UpdateAutomationEventStatusFinishedParams{
				Status:       "timeout",
				ID:           args.JobID,
				AffectedRows: affectedRows,
			}); err != nil {
				log.Printf("error updating job status: %v", err)
			}
		} else {
			if err := js.repo.UpdateAutomationEventStatusFinished(ctx, db.UpdateAutomationEventStatusFinishedParams{
				Status: "error",
				ID:     args.JobID,
			}); err != nil {
				log.Printf("error updating job status: %v", err)
			}
		}

		return nil
	}

	// mark job as finished
	if err := js.repo.UpdateAutomationEventStatusFinished(ctx, db.UpdateAutomationEventStatusFinishedParams{
		Status:       "finished",
		ID:           args.JobID,
		AffectedRows: affectedRows,
	}); err != nil {
		log.Printf("error updating job status: %v", err)
	}

	return nil
}
