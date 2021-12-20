include .env
export

postgres="postgres://${POSTGRES_USER}:${POSTGRES_PASS}@${POSTGRES_HOST}/${POSTGRES_DB}?sslmode=disable"

all: models migrate app

models:
	sqlc generate

migrate:
	migrate -verbose -path ./migrations/ -database ${postgres} up

app:
	go build ./cmd/...

db-reset:
	migrate -verbose -path ./migrations/ -database ${postgres} drop
	migrate -verbose -path ./migrations/ -database ${postgres} up
