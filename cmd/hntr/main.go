package main

import (
	"flag"
	"log"
	"os"

	"hntr/db"
	"hntr/web"

	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
	"github.com/peterbourgon/ff/v3"
)

func main() {

	// load all settings from .env file
	err := godotenv.Load()
	if err != nil {
		log.Fatal("Error loading .env file")
	}

	fs := flag.NewFlagSet("hntr", flag.ExitOnError)

	var (
		dbServer = fs.String("postgres-server", "", "postgres server")
		dbName   = fs.String("postgres-db", "", "postgres dbname")
		dbUser   = fs.String("postgres-user", "", "postgres user")
		dbPass   = fs.String("postgres-pass", "", "postgres password")
		bind     = fs.String("bind", ":8080", "bind to [ip]:port")
	)

	// allow configuration to come from environment (which is loaded via .env file)
	ff.Parse(fs, os.Args[1:], ff.WithEnvVarNoPrefix())

	// setup repository for db access
	repo, dbc, err := db.SetupRepository(*dbServer, *dbName, *dbUser, *dbPass)
	defer dbc.Close()

	if err != nil {
		log.Fatal(err)
	}

	// setup server
	server := web.NewServer(*bind, repo)

	// start webserver
	if err := server.Start(); err != nil {
		log.Fatal(err)
	}
}
