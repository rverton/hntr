# hntr-go

## Configuration

Example `.env` file
```
BIND=127.0.0.1:8080
POSTGRES_HOST=localhost:5432
POSTGRES_DB=hntr-go
POSTGRES_USER=postgres
POSTGRES_PASS=postgres

POSTGRES_TEST_HOST=localhost:5432
POSTGRES_TEST_DB=hntr-go_test
POSTGRES_TEST_USER=postgres
POSTGRES_TEST_PASS=postgres
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
    
### Testing

For testing, a real postgres db is used, configured via `POSTGRES_TEST_*`.

    $ make test
