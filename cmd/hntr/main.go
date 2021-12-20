package main

import (
	"context"
	"flag"
	"fmt"
	"log"
	"os"

	"hntr/db"

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
	)

	// allow configuration to come from environment (which is loaded via .env file)
	ff.Parse(fs, os.Args[1:], ff.WithEnvVarNoPrefix())

	// setup repository for db access
	repo, err := db.SetupRepository(*dbServer, *dbName, *dbUser, *dbPass)

	if err != nil {
		log.Fatal(err)
	}

	ctx := context.Background()
	fmt.Println(repo.ListBoxes(ctx))
}
