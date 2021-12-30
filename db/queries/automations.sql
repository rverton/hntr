-- name: ListAutomations :many
SELECT * FROM automations WHERE box_id = $1;

-- name: GetAutomation :one
SELECT * FROM automations WHERE id = $1 LIMIT 1;
