-- name: ListBoxes :many
SELECT * FROM boxes;

-- name: GetBox :one
SELECT * FROM boxes WHERE id = $1;

-- name: CreateBox :one
INSERT INTO boxes (name) VALUES ($1) RETURNING *;
