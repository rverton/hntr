CREATE TABLE IF NOT EXISTS gue_finished_jobs
(
    job_id          bigint   NOT NULL,
    queue           text     NOT NULL,
    job_type        text     NOT NULL,
    args            json     NOT NULL,
    error_count     integer  NOT NULL DEFAULT 0,
    last_error      text,

    started_at      timestamptz,
    finished_at     timestamptz NOT NULL
);
