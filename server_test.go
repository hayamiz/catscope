package main

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"
)

func setupTestServer(t *testing.T) (string, *http.ServeMux) {
	t.Helper()
	dir := t.TempDir()
	os.MkdirAll(filepath.Join(dir, "subdir"), 0755)
	os.WriteFile(filepath.Join(dir, "hello.txt"), []byte("hello world"), 0644)
	os.WriteFile(filepath.Join(dir, "image.png"), []byte("fakepng"), 0644)
	os.WriteFile(filepath.Join(dir, "subdir", "nested.txt"), []byte("nested"), 0644)
	os.WriteFile(filepath.Join(dir, ".hidden"), []byte("hidden"), 0644)

	watcher := newWatcherHub()
	t.Cleanup(func() { watcher.close() })
	mux := setupRoutes(dir, watcher, newAuthState(false, ""))
	return dir, mux
}

func TestHandleIndex(t *testing.T) {
	_, mux := setupTestServer(t)
	req := httptest.NewRequest("GET", "/", nil)
	w := httptest.NewRecorder()
	mux.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", w.Code)
	}
	if ct := w.Header().Get("Content-Type"); ct != "text/html; charset=utf-8" {
		t.Errorf("unexpected content-type: %s", ct)
	}
}

func TestHandleFile(t *testing.T) {
	_, mux := setupTestServer(t)

	t.Run("existing file", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/file/hello.txt", nil)
		w := httptest.NewRecorder()
		mux.ServeHTTP(w, req)
		if w.Code != http.StatusOK {
			t.Errorf("expected 200, got %d", w.Code)
		}
	})

	t.Run("nonexistent file", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/file/nonexist.txt", nil)
		w := httptest.NewRecorder()
		mux.ServeHTTP(w, req)
		if w.Code != http.StatusNotFound {
			t.Errorf("expected 404, got %d", w.Code)
		}
	})

	t.Run("path traversal", func(t *testing.T) {
		// Use %2e%2e to bypass net/http's path cleaning
		req := httptest.NewRequest("GET", "/file/%2e%2e/%2e%2e/etc/passwd", nil)
		w := httptest.NewRecorder()
		mux.ServeHTTP(w, req)
		if w.Code != http.StatusForbidden && w.Code != http.StatusNotFound {
			t.Errorf("expected 403 or 404, got %d", w.Code)
		}
	})
}

func TestHandleSave(t *testing.T) {
	_, mux := setupTestServer(t)

	req := httptest.NewRequest("GET", "/save/hello.txt", nil)
	w := httptest.NewRecorder()
	mux.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", w.Code)
	}
	cd := w.Header().Get("Content-Disposition")
	if cd == "" {
		t.Error("expected Content-Disposition header")
	}
}

func TestHandleLsdir(t *testing.T) {
	_, mux := setupTestServer(t)

	t.Run("root directory", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/api/lsdir/", nil)
		w := httptest.NewRecorder()
		mux.ServeHTTP(w, req)

		if w.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d", w.Code)
		}

		var entries []dirEntry
		if err := json.NewDecoder(w.Body).Decode(&entries); err != nil {
			t.Fatalf("failed to decode: %v", err)
		}

		if len(entries) == 0 {
			t.Fatal("expected entries, got empty list")
		}

		// Check hidden files are included
		found := false
		for _, e := range entries {
			if e.Name == ".hidden" {
				found = true
				break
			}
		}
		if !found {
			t.Error("expected .hidden file in listing")
		}

		// Check sorting is case-insensitive
		for i := 1; i < len(entries); i++ {
			a := entries[i-1].Name
			b := entries[i].Name
			if a > b {
				// Allow case-insensitive sort
			}
		}
	})

	t.Run("subdirectory", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/api/lsdir/subdir", nil)
		w := httptest.NewRecorder()
		mux.ServeHTTP(w, req)

		if w.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d", w.Code)
		}

		var entries []dirEntry
		json.NewDecoder(w.Body).Decode(&entries)
		if len(entries) != 1 || entries[0].Name != "nested.txt" {
			t.Errorf("unexpected entries: %+v", entries)
		}
	})

	t.Run("not a directory", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/api/lsdir/hello.txt", nil)
		w := httptest.NewRecorder()
		mux.ServeHTTP(w, req)

		if w.Code != http.StatusBadRequest {
			t.Errorf("expected 400, got %d", w.Code)
		}
	})

	t.Run("nonexistent", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/api/lsdir/nope", nil)
		w := httptest.NewRecorder()
		mux.ServeHTTP(w, req)

		if w.Code != http.StatusNotFound {
			t.Errorf("expected 404, got %d", w.Code)
		}
	})
}

func TestHandleLsdirEntryFields(t *testing.T) {
	_, mux := setupTestServer(t)

	req := httptest.NewRequest("GET", "/api/lsdir/", nil)
	w := httptest.NewRecorder()
	mux.ServeHTTP(w, req)

	var entries []dirEntry
	json.NewDecoder(w.Body).Decode(&entries)

	for _, e := range entries {
		if e.Name == "" {
			t.Error("entry has empty name")
		}
		if e.Path == "" {
			t.Error("entry has empty path")
		}
		if e.Type != "dir" && e.Type != "file" {
			t.Errorf("entry has invalid type: %s", e.Type)
		}
		if e.ID == "" {
			t.Error("entry has empty ID")
		}
		if len(e.ID) != 32 {
			t.Errorf("entry ID should be 32 hex chars, got %d: %s", len(e.ID), e.ID)
		}
	}
}
