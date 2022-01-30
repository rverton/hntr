package web

import (
	"context"
	"embed"
	"fmt"
	"hntr/db"
	"hntr/frontend"
	"io/fs"
	"net"
	"net/http"
	"os"
	"time"

	"github.com/go-playground/validator/v10"
	"github.com/jackc/pgx/v4/pgxpool"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"github.com/vgarvardt/gue/v3"
)

var ShutdownTimeout = 2 * time.Second

const LIMIT_MAX = 50000
const LIMIT_RECORDS = 100000
const TAGS_MAX = 10

type Server struct {
	server *echo.Echo
	addr   string

	repo   *db.Queries
	dbPool *pgxpool.Pool
	queue  *gue.Client

	recordsLimit int
}

type CustomValidator struct {
	validator *validator.Validate
}

func (cv *CustomValidator) Validate(i interface{}) error {
	if err := cv.validator.Struct(i); err != nil {
		return err
	}

	return nil
}

func validationErrorMsg(fe validator.FieldError) string {
	switch fe.Tag() {
	case "required":
		return "This field is required"
	case "email":
		return "Invalid email"
	case "min":
		return "Invalid minimum length"

	case "max":
		return "Invalid maximum length"
	}
	return fe.Error() // default error
}

func NewServer(addr string, recordsLimit int, repo *db.Queries, dbPool *pgxpool.Pool, gc *gue.Client) *Server {
	debugMode := os.Getenv("DEBUG") != ""

	server := &Server{
		addr:         addr,
		queue:        gc,
		dbPool:       dbPool,
		recordsLimit: recordsLimit,
	}

	e := echo.New()
	e.Validator = &CustomValidator{validator: validator.New()}
	e.HideBanner = true

	// Middleware
	e.Use(middleware.Recover())
	e.Use(middleware.LoggerWithConfig(middleware.LoggerConfig{
		Format: "${method} ${uri} => ${status}\n",
	}))

	server.server = e
	server.repo = repo

	// boxes
	e.GET("/api/box/:id", server.GetBox)
	e.POST("/api/box/create", server.CreateBox)
	e.PUT("/api/box/:id", server.UpdateBox)
	e.DELETE("/api/box/:id", server.DeleteBox)

	// records
	e.GET("/api/box/:id/_count", server.CountRecords)
	e.GET("/api/box/:id/:container", server.ListRecords)
	e.POST("/api/box/:id/:container", server.AddRecords)
	e.PUT("/api/box/:id/:container/_deleterecords", server.DeleteRecords)
	e.PUT("/api/box/:id/:container", server.UpdateRecords)

	// automations
	e.GET("/api/box/:id/automations", server.ListAutomations)
	e.GET("/api/box/:id/_counts", server.GetAutomationEventCounts)
	e.POST("/api/box/:id/_clear", server.ClearAutomationEvents)
	e.GET("/api/box/:id/_dequeue", server.DequeueJobs)
	e.POST("/api/box/:id/_results/:jobid", server.UpdateAutomationEvent)
	e.POST("/api/box/:id/automations", server.AddAutomation)
	e.GET("/api/automations/:id/events", server.ListAutomationEvents)
	e.POST("/api/automations/:id/start", server.StartAutomation)
	e.GET("/api/automations/library", server.ListAutomationLibrary)
	e.DELETE("/api/automations/:id", server.RemoveAutomation)
	e.PUT("/api/automations/:id", server.UpdateAutomation)

	assetHandler := http.FileServer(getFileSystem(frontend.Files, debugMode, e.Logger))
	e.GET("/*", echo.WrapHandler(assetHandler))

	return server
}

func (s *Server) Start() error {
	return s.server.Start(s.addr)
}

func (s *Server) Shutdown() error {
	ctx, cancel := context.WithTimeout(context.Background(), ShutdownTimeout)
	defer cancel()
	return s.server.Shutdown(ctx)
}

// Scheme returns the URL scheme for the server.
func (s *Server) Scheme() string {
	return "http"
}

func (s *Server) Port() int {
	if s.server.Listener == nil {
		return 0
	}
	return s.server.Listener.Addr().(*net.TCPAddr).Port
}

// URL returns the local base URL of the running server.
func (s *Server) URL() string {
	scheme, port := s.Scheme(), s.Port()

	// Use localhost unless a domain is specified.
	domain := "localhost"

	// Return without port if using standard ports.
	if (scheme == "http" && port == 80) || (scheme == "https" && port == 443) {
		return fmt.Sprintf("%s://%s", s.Scheme(), domain)
	}
	return fmt.Sprintf("%s://%s:%d", s.Scheme(), domain, s.Port())
}

// Server returns the current echo instance, mainly used for testing
func (s *Server) Server() *echo.Echo {
	return s.server
}

func getFileSystem(embededFiles embed.FS, useOS bool, logger echo.Logger) http.FileSystem {
	if useOS {
		logger.Info("using assets from filesystem")
		return http.FS(os.DirFS("out"))
	}

	logger.Info("using assets embedded in binary")
	fsys, err := fs.Sub(embededFiles, "out")
	if err != nil {
		panic(err)
	}

	return http.FS(fsys)
}
