# hntr-go

## Configuration

Example `.env` file
```
BIND=127.0.0.1:8080
POSTGRES_URL=postgres://postgres:postgres@localhost:5432/dbname
POSTGRES_TEST_URL=postgres://postgres:postgres@localhost:5432/dbname
```

## Development

Required:

 * Migrations via [golang-migrate](https://github.com/golang-migrate/migrate)
 * SQL model generation via [sqlc](https://github.com/kyleconroy/sqlc)

Usage:
Configuration is read from cli flags or from `.env`.

Database stuff can be setup via:

    $ make migrate
    $ sqlc generate
    
Watch mode to run a watcher for the backend (`*.go`) and for the frontend (Next.js):

    $ make watch
    $ make watch-frontend
    
### Testing

For testing, a real postgres db is used, configured via `POSTGRES_TEST_*`.

    $ make test
