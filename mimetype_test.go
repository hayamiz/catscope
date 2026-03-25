package main

import (
	"os"
	"path/filepath"
	"testing"
)

func TestMimeTypeForFile(t *testing.T) {
	tests := []struct {
		name   string
		file   string
		expect string
	}{
		{"jpeg", "photo.jpg", "image/jpeg"},
		{"jpeg upper", "PHOTO.JPG", "image/jpeg"},
		{"jpeg ext", "photo.jpeg", "image/jpeg"},
		{"png", "image.png", "image/png"},
		{"gif", "anim.gif", "image/gif"},
		{"svg", "icon.svg", "image/svg+xml"},
		{"webp", "photo.webp", "image/webp"},
		{"pdf", "doc.pdf", "application/pdf"},
		{"eps", "vector.eps", "application/postscript"},
		{"html", "page.html", "text/html; charset=utf-8"},
		{"htm", "page.htm", "text/html; charset=utf-8"},
		{"css", "style.css", "text/css"},
		{"js", "app.js", "application/javascript"},
		{"json", "data.json", "application/json"},
		{"xml", "data.xml", "application/xml"},
		{"txt", "readme.txt", "text/plain; charset=utf-8"},
		{"csv", "data.csv", "text/csv; charset=utf-8"},
		{"tsv", "data.tsv", "text/tab-separated-values; charset=utf-8"},
		{"log", "app.log", "text/plain; charset=utf-8"},
		{"md", "README.md", "text/plain; charset=utf-8"},
		{"yaml", "config.yaml", "text/plain; charset=utf-8"},
		{"yml", "config.yml", "text/plain; charset=utf-8"},
		{"toml", "config.toml", "text/plain; charset=utf-8"},
		{"unknown", "file.xyz", "application/octet-stream"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := mimeTypeForFile(tt.file)
			if got != tt.expect {
				t.Errorf("mimeTypeForFile(%q) = %q, want %q", tt.file, got, tt.expect)
			}
		})
	}
}

func TestIsTextFile(t *testing.T) {
	tests := []struct {
		file   string
		expect bool
	}{
		{"file.txt", true},
		{"file.json", true},
		{"file.md", true},
		{"file.png", false},
		{"file.exe", false},
	}
	for _, tt := range tests {
		if got := isTextFile(tt.file); got != tt.expect {
			t.Errorf("isTextFile(%q) = %v, want %v", tt.file, got, tt.expect)
		}
	}
}

func TestIsLikelyText(t *testing.T) {
	t.Helper()
	writeTemp := func(t *testing.T, name string, content []byte) string {
		t.Helper()
		path := filepath.Join(t.TempDir(), name)
		if err := os.WriteFile(path, content, 0644); err != nil {
			t.Fatal(err)
		}
		return path
	}

	tests := []struct {
		name    string
		content []byte
		expect  bool
	}{
		{"ascii text", []byte("Hello, world!\n"), true},
		{"utf8 multibyte", []byte("こんにちは世界"), true},
		{"tabs and crlf", []byte("col1\tcol2\r\nval1\tval2\r\n"), true},
		{"whitespace only", []byte("\n\t  \n"), true},
		{"nul byte", []byte("hello\x00world"), false},
		{"control chars", []byte("\x01\x02\x03"), false},
		{"bell char", []byte("text\x07more"), false},
		{"del char", []byte("text\x7fmore"), false},
		{"empty file", []byte{}, false},
		{"elf binary", []byte("\x7fELF\x02\x01\x01\x00"), false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			path := writeTemp(t, "testfile", tt.content)
			if got := isLikelyText(path); got != tt.expect {
				t.Errorf("isLikelyText() = %v, want %v", got, tt.expect)
			}
		})
	}

	t.Run("nonexistent file", func(t *testing.T) {
		if isLikelyText("/nonexistent/path/file") {
			t.Error("isLikelyText() should return false for nonexistent file")
		}
	})
}

func TestMimeTypeForFilePath(t *testing.T) {
	t.Helper()
	writeTemp := func(t *testing.T, name string, content []byte) string {
		t.Helper()
		path := filepath.Join(t.TempDir(), name)
		if err := os.WriteFile(path, content, 0644); err != nil {
			t.Fatal(err)
		}
		return path
	}

	t.Run("known extension unchanged", func(t *testing.T) {
		path := writeTemp(t, "file.txt", []byte("hello"))
		got := mimeTypeForFilePath(path)
		if got != "text/plain; charset=utf-8" {
			t.Errorf("got %q, want text/plain", got)
		}
	})

	t.Run("unknown extension with text content", func(t *testing.T) {
		path := writeTemp(t, "file.xyz", []byte("some plain text\n"))
		got := mimeTypeForFilePath(path)
		if got != "text/plain; charset=utf-8" {
			t.Errorf("got %q, want text/plain; charset=utf-8", got)
		}
	})

	t.Run("unknown extension with binary content", func(t *testing.T) {
		path := writeTemp(t, "file.xyz", []byte{0x00, 0x01, 0x02, 0xFF})
		got := mimeTypeForFilePath(path)
		if got != "application/octet-stream" {
			t.Errorf("got %q, want application/octet-stream", got)
		}
	})

	t.Run("no extension with text content", func(t *testing.T) {
		path := writeTemp(t, "Makefile", []byte("all:\n\techo hello\n"))
		got := mimeTypeForFilePath(path)
		if got != "text/plain; charset=utf-8" {
			t.Errorf("got %q, want text/plain; charset=utf-8", got)
		}
	})
}
