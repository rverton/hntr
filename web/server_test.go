package web

import (
	"database/sql"
	"hntr/db"
	"hntr/jobs"
	"os"
	"testing"

	"github.com/golang-migrate/migrate/v4"
	"github.com/golang-migrate/migrate/v4/database/pgx"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	"github.com/jackc/pgx/v4/pgxpool"

	"github.com/joho/godotenv"
	"github.com/labstack/echo/v4"
)

func init() {
	err := godotenv.Load("../.env")
	if err != nil {
		panic(err)
	}
}

func MustSetupTest(tb testing.TB) (*echo.Echo, *db.Queries, *pgxpool.Pool) {
	tb.Helper()

	// setup repository for test db access
	dbc, err := sql.Open("pgx", os.Getenv("POSTGRES_TEST_URL"))
	if err != nil {
		panic(err)
	}

	// set test database to a clean state
	if _, err := dbc.Exec("DROP SCHEMA public CASCADE"); err != nil {
		panic(err)
	}
	if _, err := dbc.Exec("CREATE SCHEMA public"); err != nil {
		panic(err)
	}
	if _, err := dbc.Exec("GRANT ALL ON SCHEMA public TO postgres;"); err != nil {
		panic(err)
	}
	if _, err := dbc.Exec("GRANT ALL ON SCHEMA public TO public;"); err != nil {
		panic(err)
	}

	driver, err := pgx.WithInstance(dbc, &pgx.Config{})
	if err != nil {
		panic(err)
	}

	// initiate migrator from migrations folder
	m, err := migrate.NewWithDatabaseInstance(
		"file://../migrations",
		"postgres", driver)
	if err != nil {
		panic(err)
	}

	// run all migrations
	if err := m.Up(); err != nil {
		panic(err)
	}

	repo, repoDbc, err := db.SetupRepository(os.Getenv("POSTGRES_TEST_URL"), true)
	defer dbc.Close()

	// setup queue
	gc, shutdownQueue := jobs.Init(os.Getenv("POSTGRES_TEST_URL"), repo)
	defer shutdownQueue()

	// setup web server
	server := NewServer(":0", 1000, repo, repoDbc, gc).Server()

	return server, repo, repoDbc
}

func MustCloseTest(tb testing.TB, db *pgxpool.Pool) {
	tb.Helper()

	db.Close()
}
