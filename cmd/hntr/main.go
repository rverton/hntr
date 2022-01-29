package main

import (
	"flag"
	"log"
	"os"

	"hntr/db"
	"hntr/jobs"
	"hntr/web"

	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
	"github.com/peterbourgon/ff/v3"
)

// build version, injected during build.
var (
	commitHash string
	commitDate string
)

func main() {
	log.Printf("commit=%v, commitDate=%v\n", commitHash, commitDate)
	log.SetFlags(log.LstdFlags | log.Lshortfile)

	// load all settings from .env file
	err := godotenv.Load()
	if err != nil {
		log.Fatal("Error loading .env file")
	}

	fs := flag.NewFlagSet("hntr", flag.ExitOnError)

	var (
		dbUrl        = fs.String("postgres-url", "", "postgres db url, e.g. postgres://user:pass@localhost:5432/dbname")
		bind         = fs.String("bind", ":8080", "bind to [ip]:port")
		recordsLimit = fs.Int("insert-limit", 25000, "max. number of records")
		seed         = fs.Bool("seed", false, "load seed data")
	)

	// allow configuration to come from environment (which is loaded via .env file)
	ff.Parse(fs, os.Args[1:], ff.WithEnvVarNoPrefix())

	// setup repository for db access
	repo, dbc, err := db.SetupRepository(*dbUrl, os.Getenv("DEBUG") != "")
	defer dbc.Close()

	if err != nil {
		log.Fatal(err)
	}

	// start job queue
	gc, shutdownQueue := jobs.Init(*dbUrl, repo)
	defer shutdownQueue()

	// setup webserver
	server := web.NewServer(*bind, *recordsLimit, repo, dbc, gc)

	// seed?
	if *seed {
		log.Println("seeding database")
		log.Println(seedDb(repo))
		os.Exit(0)
	}

	// start webserver
	if err := server.Start(); err != nil {
		log.Fatal(err)
	}
}
