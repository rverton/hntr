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

	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"github.com/vgarvardt/gue/v3"
)

var ShutdownTimeout = 2 * time.Second

type Server struct {
	server *echo.Echo
	addr   string

	repo  *db.Queries
	queue *gue.Client
}

func NewServer(addr string, repo *db.Queries, gc *gue.Client) *Server {
	debugMode := os.Getenv("DEBUG") != ""

	server := &Server{
		addr:  addr,
		queue: gc,
	}

	e := echo.New()
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

	// hostnames
	e.GET("/api/box/:id/hostnames", server.ListHostnames)
	e.POST("/api/box/:id/hostnames", server.AddHostnames)

	// automations
	e.GET("/api/box/:id/automations", server.ListAutomations)
	e.POST("/api/automations/:id/start", server.StartAutomation)

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
