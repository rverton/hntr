-- name: ListAutomations :many
SELECT * FROM automations WHERE box_id = $1;

-- name: ListAutomationLibrary :many
SELECT 
    id, name, description, command, source_container, source_tags, destination_container, destination_tags, is_public
FROM automations
WHERE is_public = true;

-- name: GetAutomation :one
SELECT * FROM automations WHERE id = $1 LIMIT 1;

-- name: CreateAutomationEvent :one
INSERT INTO automation_events (
    box_id, automation_id, data, status, unique_results
) VALUES ($1, $2, $3, $4, $5) RETURNING *; 

-- name: UpdateAutomationEventStatusStarted :exec
UPDATE automation_events SET status = 'started' where id = $1;

-- name: UpdateAutomationEventStatusFinished :exec
UPDATE automation_events SET status = 'finished', finished_at = now() where id = $1;

-- name: ListAutomationEvents :many
SELECT * FROM automation_events WHERE automation_id = $1 ORDER BY created_at DESC LIMIT $2;

-- name: CreateAutomation :one
INSERT INTO automations (
    name, description, box_id, command, source_container, source_tags, destination_container, destination_tags, is_public
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *;
