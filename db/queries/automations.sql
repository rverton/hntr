-- name: ListAutomations :many
SELECT * FROM automations WHERE box_id = $1;

-- name: GetAutomationEventCounts :many
SELECT status, count(*) FROM automation_events WHERE box_id = $1 group by status;

-- name: ListAutomationLibrary :many
SELECT 
    id, name, description, command, source_container, source_tags, destination_container, destination_tags, is_public
FROM automations
WHERE is_public = true;

-- name: GetAutomation :one
SELECT * FROM automations WHERE id = $1 LIMIT 1;

-- name: UpdateAutomation :exec
UPDATE automations SET
    name=$1,
    description=$2,
    source_container=$3,
    source_tags=$4,
    destination_container=$5,
    destination_tags=$6,
    command=$7
WHERE id = $8;

-- name: GetAutomationEvent :one
SELECT * FROM automation_events WHERE id = $1 LIMIT 1;

-- name: CreateAutomationEvent :one
INSERT INTO automation_events (
    box_id, automation_id, data, status, affected_rows
) VALUES ($1, $2, $3, $4, $5) RETURNING *; 

-- name: UpdateAutomationEventStatus :exec
UPDATE automation_events SET status = $1 where id = $2;

-- name: UpdateAutomationEventStatusFinished :exec
UPDATE automation_events SET status = $1, affected_rows = $2, finished_at = now() where id = $3;

-- name: ListAutomationEvents :many
SELECT * FROM automation_events WHERE automation_id = $1 ORDER BY created_at DESC LIMIT $2;

-- name: DequeueAutomationEvents :many
UPDATE automation_events SET
    status = 'processing', started_at = now()
WHERE id IN (
    SELECT id
    FROM automation_events ae
    WHERE ae.box_id = $1 AND ae.status = 'scheduled'
    ORDER BY ae.created_at
    FOR UPDATE SKIP LOCKED
    LIMIT $2
) RETURNING *;

-- name: CreateAutomation :one
INSERT INTO automations (
    name, description, box_id, command, source_container, source_tags, destination_container, destination_tags, is_public
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *;

-- name: DeleteAutomation :exec
DELETE FROM automations WHERE id = $1;

-- name: DeleteAutomationEventsOld :exec
DELETE FROM automation_events WHERE created_at < (now() - '7 days'::interval);

-- name: DeleteAutomationEvents :exec
DELETE FROM automation_events WHERE box_id = $1 AND status = $2;

-- name: CountAutomationEvents :one
SELECT count(*) from automation_events WHERE box_id = $1;
