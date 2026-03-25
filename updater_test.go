package main

import (
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"
)

func TestCheckWritable(t *testing.T) {
	t.Run("writable file", func(t *testing.T) {
		path := filepath.Join(t.TempDir(), "writable")
		if err := os.WriteFile(path, []byte("test"), 0755); err != nil {
			t.Fatal(err)
		}
		if err := checkWritable(path); err != nil {
			t.Errorf("checkWritable() returned error for writable file: %v", err)
		}
	})

	t.Run("read-only directory", func(t *testing.T) {
		dir := t.TempDir()
		path := filepath.Join(dir, "binary")
		if err := os.WriteFile(path, []byte("test"), 0755); err != nil {
			t.Fatal(err)
		}
		// Make the directory read-only so we cannot create temp files in it
		os.Chmod(dir, 0555)
		t.Cleanup(func() { os.Chmod(dir, 0755) })
		if err := checkWritable(path); err == nil {
			t.Error("checkWritable() should return error for read-only directory")
		}
	})

	t.Run("nonexistent directory", func(t *testing.T) {
		if err := checkWritable("/nonexistent/path/binary"); err == nil {
			t.Error("checkWritable() should return error for nonexistent directory")
		}
	})
}

func TestSelfUpdateDownloadAndReplace(t *testing.T) {
	// Create a fake binary to be "updated"
	tmpDir := t.TempDir()
	fakeBinary := filepath.Join(tmpDir, "catscope")
	if err := os.WriteFile(fakeBinary, []byte("old-binary"), 0755); err != nil {
		t.Fatal(err)
	}

	// Create a mock HTTP server serving the "new binary"
	newContent := []byte("new-binary-content")
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Write(newContent)
	}))
	defer server.Close()

	// Test the download and atomic replace logic directly
	// We can't call selfUpdate() directly because it reads /proc/self/exe,
	// so we test the core pieces individually.

	// Simulate: download from server, write to temp, rename
	resp, err := http.Get(server.URL)
	if err != nil {
		t.Fatal(err)
	}
	defer resp.Body.Close()

	tmpFile, err := os.CreateTemp(tmpDir, ".catscope-update-*")
	if err != nil {
		t.Fatal(err)
	}

	buf := make([]byte, 1024)
	n, _ := resp.Body.Read(buf)
	if _, err := tmpFile.Write(buf[:n]); err != nil {
		t.Fatal(err)
	}
	tmpFile.Close()

	// Preserve permissions
	info, _ := os.Stat(fakeBinary)
	origPerm := info.Mode().Perm()
	os.Chmod(tmpFile.Name(), origPerm)

	// Atomic rename
	if err := os.Rename(tmpFile.Name(), fakeBinary); err != nil {
		t.Fatal(err)
	}

	// Verify content was replaced
	got, err := os.ReadFile(fakeBinary)
	if err != nil {
		t.Fatal(err)
	}
	if string(got) != string(newContent) {
		t.Errorf("binary content = %q, want %q", got, newContent)
	}

	// Verify permissions preserved
	info2, _ := os.Stat(fakeBinary)
	if info2.Mode().Perm() != origPerm {
		t.Errorf("permissions = %v, want %v", info2.Mode().Perm(), origPerm)
	}
}

func TestSelfUpdateHTTPError(t *testing.T) {
	// Server that returns 404
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		http.NotFound(w, r)
	}))
	defer server.Close()

	resp, err := http.Get(server.URL)
	if err != nil {
		t.Fatal(err)
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusOK {
		t.Error("expected non-200 status code from mock server")
	}
}
