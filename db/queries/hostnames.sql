-- name: ListHostnamesByBox :many
SELECT * from hostnames WHERE box_id = $1 ORDER BY created_at DESC;

-- name: ListHostnamesByBoxFilter :many
SELECT * from hostnames WHERE box_id = $1 AND hostname like $2 AND $3::text[] <@ tags ORDER BY created_at DESC;

-- name: CreateHostname :exec
INSERT INTO hostnames (hostname, tags, box_id, source) VALUES ($1, $2, $3, $4) RETURNING *;
