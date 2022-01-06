include .env
export

postgres=${POSTGRES_URL}

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

seed:
	go run ./cmd/hntr/ -seed

watch:
	ulimit -n 1000 #increase the file watch limit, might required on MacOS
	reflex -R '^frontend/' -s -r '\.go$$' make run

watch-frontend:
	cd ./frontend/ && npm run dev

db-reset:
	migrate -verbose -path ./migrations/ -database ${postgres} drop
	migrate -verbose -path ./migrations/ -database ${postgres} up

frontend:
	cd ./frontend/ && npx next build && npx next export

test:
	go test ./...
