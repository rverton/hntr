package web

import (
	"database/sql"
	"hntr/db"
	"os"
	"testing"

	"github.com/golang-migrate/migrate/v4"
	"github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"

	"github.com/joho/godotenv"
	"github.com/labstack/echo/v4"
)

func init() {
	err := godotenv.Load("../.env")
	if err != nil {
		panic(err)
	}
}

func MustSetupTest(tb testing.TB) (*echo.Echo, *db.Queries, *sql.DB) {
	tb.Helper()

	// setup repository for test db access
	repo, dbc, err := db.SetupRepository(
		os.Getenv("POSTGRES_TEST_HOST"),
		os.Getenv("POSTGRES_TEST_DB"),
		os.Getenv("POSTGRES_TEST_USER"),
		os.Getenv("POSTGRES_TEST_PASS"),
	)
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

	driver, err := postgres.WithInstance(dbc, &postgres.Config{})
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

	// setup web server
	server := NewServer(":0", repo).Server()

	return server, repo, dbc
}

func MustCloseTest(tb testing.TB, db *sql.DB) {
	tb.Helper()

	db.Close()
}
