include .env
export

postgres="postgres://${POSTGRES_USER}:${POSTGRES_PASS}@${POSTGRES_HOST}/${POSTGRES_DB}?sslmode=disable"

.PHONY: frontend

all: migrate frontend build

models:
	sqlc generate

migrate:
	migrate -verbose -path ./migrations/ -database ${postgres} up

build:
	go build -ldflags "-X main.commitHash=$$(git rev-parse --short HEAD) -X main.commitDate=$$(git log -1 --format=%ct)" -o . ./cmd/...

run:
	go run ./cmd/hntr/

watch:
	ulimit -n 1000 #increase the file watch limit, might required on MacOS
	reflex -R '^frontend/' -s -r '\.go$$' make run

db-reset:
	migrate -verbose -path ./migrations/ -database ${postgres} drop
	migrate -verbose -path ./migrations/ -database ${postgres} up

frontend:
	cd ./frontend/ && npx next export

test:
	go test ./...
