-- name: ListRecordsByBoxFilter :many
SELECT * FROM records WHERE 
    box_id = $1 AND
    container = $2 AND
    $3::varchar[] <@ tags AND
    data LIKE $4 
ORDER BY created_at DESC;

-- name: ListRecordsByBoxFilterPaginated :many
SELECT * FROM records WHERE 
    box_id = $1 AND
    container = $2 AND
    $3::varchar[] <@ tags AND
    data LIKE $4
ORDER BY created_at DESC
LIMIT $5 OFFSET $6;

-- name: CountRecordsByBoxFilter :one
SELECT count(*) FROM records WHERE 
    box_id = $1 AND
    container = $2 AND
    $3::varchar[] <@ tags AND
    data LIKE $4;

-- name: CountRecordsByBox :one
SELECT count(*) FROM records WHERE 
    box_id = $1; 

-- name: CreateRecord :exec
INSERT INTO records (data, tags, box_id, container) VALUES ($1, $2, $3, $4);

-- name: UpdateRecordTags :exec
UPDATE records SET
    tags = $1
WHERE
    box_id = $2 AND container = $3 AND data = ANY($4::varchar[]);
