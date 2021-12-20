# hntr-go

## Development

Required:

 * Migrations via [golang-migrate](https://github.com/golang-migrate/migrate)
 * SQL model generation via [sqlc](https://github.com/kyleconroy/sqlc)

Usage:
Configuration is read from cli flags or from `.env`.

Database stuff can be setup via:

    $ make migrate
    $ sqlc generate
    
