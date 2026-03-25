package main

import (
	"crypto/md5"
	"encoding/json"
	"errors"
	"fmt"
	"html/template"
	"io/fs"
	"log/slog"
	"net/http"
	"os"
	"path/filepath"
	"sort"
	"strings"
)

func setupRoutes(topDir string, watcher *watcherHub) *http.ServeMux {
	mux := http.NewServeMux()

	mux.HandleFunc("GET /", handleIndex())
	mux.HandleFunc("GET /file/{path...}", handleFile(topDir))
	mux.HandleFunc("GET /preview/{path...}", handlePreview(topDir))
	mux.HandleFunc("GET /save/{path...}", handleSave(topDir))
	mux.HandleFunc("GET /api/lsdir/{path...}", handleLsdir(topDir))
	mux.HandleFunc("GET /ws", handleWebSocket(topDir, watcher))
	mux.HandleFunc("GET /assets/", handleAssets())

	return mux
}

func handleIndex() http.HandlerFunc {
	data, err := frontendFS.ReadFile("frontend/index.html")
	if err != nil {
		slog.Error("failed to read index.html", "error", err)
	}
	tmpl, err := template.New("index").Parse(string(data))
	if err != nil {
		slog.Error("failed to parse index.html template", "error", err)
	}

	type indexData struct {
		Version string
	}

	return func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/" {
			http.NotFound(w, r)
			return
		}
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		tmpl.Execute(w, indexData{Version: "v" + version})
	}
}

func handleFile(topDir string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		urlPath := r.PathValue("path")
		resolved, err := resolvePath(topDir, urlPath)
		if err != nil {
			if errors.Is(err, errPathOutsideTopDir) {
				http.Error(w, "Forbidden", http.StatusForbidden)
				return
			}
			http.NotFound(w, r)
			return
		}

		info, err := os.Stat(resolved)
		if err != nil || info.IsDir() {
			http.NotFound(w, r)
			return
		}

		w.Header().Set("Content-Type", mimeTypeForFilePath(resolved))
		http.ServeFile(w, r, resolved)
	}
}

func handlePreview(topDir string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		urlPath := r.PathValue("path")
		resolved, err := resolvePath(topDir, urlPath)
		if err != nil {
			if errors.Is(err, errPathOutsideTopDir) {
				http.Error(w, "Forbidden", http.StatusForbidden)
				return
			}
			http.NotFound(w, r)
			return
		}

		info, err := os.Stat(resolved)
		if err != nil || info.IsDir() {
			http.NotFound(w, r)
			return
		}

		ext := strings.ToLower(filepath.Ext(resolved))

		if ext == ".eps" {
			pngData, err := convertEPSToPNG(resolved)
			if err != nil {
				if errors.Is(err, errImageMagickUnavailable) {
					w.Header().Set("Content-Type", "application/json")
					w.WriteHeader(http.StatusNotImplemented)
					json.NewEncoder(w).Encode(map[string]string{
						"error":   "conversion_unavailable",
						"message": "ImageMagick is not installed. EPS preview is not available.",
					})
					return
				}
				slog.Error("EPS conversion failed", "path", resolved, "error", err)
				http.Error(w, "conversion failed", http.StatusInternalServerError)
				return
			}
			w.Header().Set("Content-Type", "image/png")
			w.Write(pngData)
			return
		}

		if ext == ".svg" {
			w.Header().Set("Content-Type", "image/svg+xml")
			http.ServeFile(w, r, resolved)
			return
		}

		w.Header().Set("Content-Type", mimeTypeForFilePath(resolved))
		http.ServeFile(w, r, resolved)
	}
}

func handleSave(topDir string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		urlPath := r.PathValue("path")
		resolved, err := resolvePath(topDir, urlPath)
		if err != nil {
			if errors.Is(err, errPathOutsideTopDir) {
				http.Error(w, "Forbidden", http.StatusForbidden)
				return
			}
			http.NotFound(w, r)
			return
		}

		info, err := os.Stat(resolved)
		if err != nil || info.IsDir() {
			http.NotFound(w, r)
			return
		}

		filename := filepath.Base(resolved)
		w.Header().Set("Content-Type", "application/octet-stream")
		w.Header().Set("Content-Disposition", fmt.Sprintf(`attachment; filename="%s"`, filename))
		http.ServeFile(w, r, resolved)
	}
}

type dirEntry struct {
	Name string `json:"name"`
	Path string `json:"path"`
	Type string `json:"type"`
	ID   string `json:"id"`
}

func handleLsdir(topDir string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		urlPath := r.PathValue("path")
		resolved, err := resolvePath(topDir, urlPath)
		if err != nil {
			if errors.Is(err, errPathOutsideTopDir) {
				http.Error(w, "Forbidden", http.StatusForbidden)
				return
			}
			http.NotFound(w, r)
			return
		}

		info, err := os.Stat(resolved)
		if err != nil {
			http.NotFound(w, r)
			return
		}
		if !info.IsDir() {
			http.Error(w, "not a directory", http.StatusBadRequest)
			return
		}

		entries, err := os.ReadDir(resolved)
		if err != nil {
			slog.Error("readdir failed", "path", resolved, "error", err)
			http.Error(w, "internal error", http.StatusInternalServerError)
			return
		}

		result := make([]dirEntry, 0, len(entries))
		for _, e := range entries {
			name := e.Name()
			relPath := filepath.Join(urlPath, name)
			relPath = filepath.ToSlash(relPath)

			entryType := "file"
			info, err := os.Stat(filepath.Join(resolved, name))
			if err != nil {
				continue
			}
			if info.IsDir() {
				entryType = "dir"
			}

			hash := md5.Sum([]byte(relPath))
			id := fmt.Sprintf("%x", hash)

			result = append(result, dirEntry{
				Name: name,
				Path: relPath,
				Type: entryType,
				ID:   id,
			})
		}

		sort.Slice(result, func(i, j int) bool {
			return strings.ToLower(result[i].Name) < strings.ToLower(result[j].Name)
		})

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(result)
	}
}

func handleAssets() http.HandlerFunc {
	sub, err := fs.Sub(frontendFS, "frontend")
	if err != nil {
		panic("failed to create sub filesystem: " + err.Error())
	}
	fileServer := http.FileServer(http.FS(sub))

	return func(w http.ResponseWriter, r *http.Request) {
		// Strip /assets/ prefix and serve from frontend FS
		r.URL.Path = strings.TrimPrefix(r.URL.Path, "/assets")
		fileServer.ServeHTTP(w, r)
	}
}
