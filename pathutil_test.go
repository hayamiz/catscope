package main

import (
	"os"
	"path/filepath"
	"testing"
)

func setupTestDir(t *testing.T) string {
	t.Helper()
	dir := t.TempDir()
	// Create test structure
	os.MkdirAll(filepath.Join(dir, "subdir", "nested"), 0755)
	os.WriteFile(filepath.Join(dir, "file.txt"), []byte("hello"), 0644)
	os.WriteFile(filepath.Join(dir, "subdir", "file2.txt"), []byte("world"), 0644)
	os.WriteFile(filepath.Join(dir, "subdir", "nested", "deep.txt"), []byte("deep"), 0644)
	// Create a symlink inside topDir
	os.Symlink(filepath.Join(dir, "subdir"), filepath.Join(dir, "link-to-subdir"))
	// Create a symlink pointing outside topDir
	outsideDir := t.TempDir()
	os.WriteFile(filepath.Join(outsideDir, "secret.txt"), []byte("secret"), 0644)
	os.Symlink(outsideDir, filepath.Join(dir, "link-outside"))
	return dir
}

func TestResolvePath(t *testing.T) {
	topDir := setupTestDir(t)

	tests := []struct {
		name    string
		urlPath string
		wantErr bool
	}{
		{"root dir", "", false},
		{"simple file", "file.txt", false},
		{"nested file", "subdir/file2.txt", false},
		{"deeply nested", "subdir/nested/deep.txt", false},
		{"symlink inside", "link-to-subdir/file2.txt", false},
		{"traversal with dotdot", "../../../etc/passwd", true},
		{"traversal encoded", "subdir/../../etc/passwd", true},
		{"symlink outside", "link-outside/secret.txt", true},
		{"nonexistent file", "nonexistent.txt", true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, err := resolvePath(topDir, tt.urlPath)
			if tt.wantErr {
				if err == nil {
					t.Errorf("expected error, got path: %s", result)
				}
			} else {
				if err != nil {
					t.Errorf("unexpected error: %v", err)
				}
			}
		})
	}
}

func TestIsInsideDir(t *testing.T) {
	tests := []struct {
		name   string
		path   string
		dir    string
		expect bool
	}{
		{"same dir", "/foo/bar", "/foo/bar", true},
		{"child path", "/foo/bar/baz", "/foo/bar", true},
		{"outside path", "/foo/baz", "/foo/bar", false},
		{"partial match", "/foo/barbaz", "/foo/bar", false},
		{"parent path", "/foo", "/foo/bar", false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := isInsideDir(tt.path, tt.dir)
			if got != tt.expect {
				t.Errorf("isInsideDir(%q, %q) = %v, want %v", tt.path, tt.dir, got, tt.expect)
			}
		})
	}
}
