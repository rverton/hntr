-- name: ListAutomations :many
SELECT * FROM automations WHERE box_id = $1;
