package main

import (
	"encoding/json"
	"log/slog"
	"net/http"
	"sync/atomic"
	"time"
)

// HealthStatus represents the server health check response.
type HealthStatus struct {
	Status    string `json:"status"`
	Uptime    string `json:"uptime"`
	Requests  int64  `json:"requests"`
	StartedAt string `json:"started_at"`
}

var (
	startTime    = time.Now()
	requestCount atomic.Int64
)

// countRequests is middleware that increments the global request counter.
func countRequests(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		requestCount.Add(1)
		next.ServeHTTP(w, r)
	})
}

// handleHealth returns the current server health as JSON.
func handleHealth(w http.ResponseWriter, r *http.Request) {
	status := HealthStatus{
		Status:    "ok",
		Uptime:    time.Since(startTime).Round(time.Second).String(),
		Requests:  requestCount.Load(),
		StartedAt: startTime.Format(time.RFC3339),
	}
	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(status); err != nil {
		slog.Error("failed to encode health status", "error", err)
	}
}

func main() {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /healthz", handleHealth)

	server := &http.Server{
		Addr:         ":4567",
		Handler:      countRequests(mux),
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 10 * time.Second,
	}

	slog.Info("starting server", "addr", server.Addr)
	if err := server.ListenAndServe(); err != nil {
		slog.Error("server exited", "error", err)
	}
}
