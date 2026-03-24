package main

import "testing"

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
