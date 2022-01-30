-- name: ListBoxes :many
SELECT * FROM boxes;

-- name: GetBox :one
SELECT * FROM boxes WHERE id = $1 LIMIT 1;

-- name: CreateBox :one
INSERT INTO boxes (name, containers) VALUES ($1, $2) RETURNING *;

-- name: UpdateBox :exec
UPDATE boxes SET
    name=$1, containers=$2
WHERE
    id=$3
RETURNING *;

-- name: UpdateLastAccessed :exec
UPDATE boxes SET last_accessed_at = NOW() WHERE id = $1;

-- name: DeleteBox :exec
DELETE FROM boxes WHERE id = $1;
