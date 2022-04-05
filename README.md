# hntr-go

Collaborative workspaces for target/recon data. Create a box and start piping target data from your favourite tools with curl. Add tags, run automations on them and filter your results.

hntr is a small but powerful tool to gather all information regarding targets. Data is organized in containers, an each data point is called a record.

![](./frontend/public/screenshot.png)

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
    
## Deployment

To deploy, first build a self-contained binary which holds the backend and the frontend app. Pass
the full url of your backend as `NEXT_PUBLIC_API_URL`: 

    $ NEXT_PUBLIC_API_URL=https://hntr.unlink.io/api make
    
Copy the generated `hntr` binary to your server, then migrate and run:

    $ ./hntr -migrate
    $ ./hntr -seed #optional
    $ ./hntr
    
This will start the backend server which also serves the frontend.

