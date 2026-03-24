package main

import (
	"embed"
	"flag"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"path/filepath"
)

//go:embed frontend
var frontendFS embed.FS

// version is set at build time via -ldflags="-X main.version=x.y.z".
// Defaults to "dev" for development builds.
var version = "dev"

func main() {
	bind := flag.String("bind", "127.0.0.1", "IP address to bind to")
	port := flag.Int("port", 4567, "Port number to listen on")
	showVersion := flag.Bool("version", false, "Display version and exit")

	flag.StringVar(bind, "o", "127.0.0.1", "IP address to bind to (shorthand)")
	flag.IntVar(port, "p", 4567, "Port number to listen on (shorthand)")
	flag.BoolVar(showVersion, "v", false, "Display version and exit (shorthand)")

	flag.Parse()

	if *showVersion {
		fmt.Printf("Catscope v%s\n", version)
		os.Exit(0)
	}

	cwd, err := os.Getwd()
	if err != nil {
		slog.Error("failed to get working directory", "error", err)
		os.Exit(1)
	}

	topDir, err := filepath.Abs(cwd)
	if err != nil {
		slog.Error("failed to resolve absolute path", "error", err)
		os.Exit(1)
	}

	topDir, err = filepath.EvalSymlinks(topDir)
	if err != nil {
		slog.Error("failed to resolve symlinks", "error", err)
		os.Exit(1)
	}

	addr := fmt.Sprintf("%s:%d", *bind, *port)

	fmt.Printf("Catscope v%s\n", version)
	fmt.Printf("Serving files from: %s\n", topDir)
	fmt.Printf("Listening on: http://%s\n", addr)

	if *bind == "0.0.0.0" {
		fmt.Printf("WARNING: Binding to 0.0.0.0 - all files in %s will be accessible from any network host.\n", topDir)
	}

	watcher := newWatcherHub()
	defer watcher.close()

	mux := setupRoutes(topDir, watcher)

	slog.Info("starting server", "addr", addr)
	if err := http.ListenAndServe(addr, mux); err != nil {
		slog.Error("server error", "error", err)
		os.Exit(1)
	}
}
