package main

import (
	"context"
	"hntr/db"
	"log"
)

func seedDb(repo *db.Queries) error {

	ctx := context.Background()

	box, err := repo.CreateBox(ctx, db.CreateBoxParams{
		Name: "Public Library",
	})
	if err != nil {
		return err
	}

	entries := []db.CreateAutomationParams{
		{
			Name:                 "amass",
			Description:          "Run amass on your defined scope domains to gather subdomains (passive) and feed them back into your hostnames table",
			BoxID:                box.ID,
			Command:              "amass enum -passive -d {data}",
			SourceContainer:      "hostnames",
			SourceTags:           []string{"is_scope"},
			DestinationContainer: "hostnames",
			DestinationTags:      []string{"source:amass"},
			IsPublic:             true,
		},
		{
			Name:                 "subfinder",
			Description:          "Run subfinder on your defined scope domains to gather subdomains (passive) and feed them back into your hostnames table",
			BoxID:                box.ID,
			Command:              "echo {data} | subfinder",
			SourceContainer:      "hostnames",
			SourceTags:           []string{"is_scope"},
			DestinationContainer: "hostnames",
			DestinationTags:      []string{"source:amass"},
			IsPublic:             true,
		},
		{
			Name:                 "Get all URLs with gau",
			Description:          "For every record, retrieve all URLs",
			BoxID:                box.ID,
			Command:              "echo {data} | gau",
			SourceContainer:      "hostnames",
			SourceTags:           []string{},
			DestinationContainer: "urls",
			DestinationTags:      []string{"source:gau"},
			IsPublic:             true,
		},
		{
			Name:                 "httpx",
			Description:          "Find all http services for a given domain",
			BoxID:                box.ID,
			Command:              "echo {data} | httpx",
			SourceContainer:      "hostnames",
			SourceTags:           []string{},
			DestinationContainer: "urls",
			DestinationTags:      []string{"source:httpx", "type:service"},
			IsPublic:             true,
		},
	}

	for _, a := range entries {
		_, err = repo.CreateAutomation(ctx, a)
		if err != nil {
			log.Printf("error adding seed: %v", err)
		}
	}

	return nil
}
