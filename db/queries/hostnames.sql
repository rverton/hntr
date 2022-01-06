-- name: ListHostnamesByBox :many
SELECT * from hostnames WHERE box_id = $1 ORDER BY created_at DESC;

-- name: ListHostnamesByBoxFilter :many
SELECT * from hostnames WHERE box_id = $1 AND hostname like $2 AND $3::varchar[] <@ tags ORDER BY created_at DESC;

-- name: ListHostnamesByBoxFilterPaginated :many
SELECT * from hostnames WHERE box_id = $1 AND hostname like $2 AND $3::varchar[] <@ tags ORDER BY created_at DESC LIMIT $4 OFFSET $5;

-- name: CountHostnamesByBoxFilter :one
SELECT count(*) from hostnames WHERE box_id = $1 AND hostname like $2 AND $3::varchar[] <@ tags;

-- name: CreateHostname :exec
INSERT INTO hostnames (hostname, tags, box_id) VALUES ($1, $2, $3) RETURNING *;
