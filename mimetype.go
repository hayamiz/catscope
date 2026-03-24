package main

import (
	"mime"
	"path/filepath"
	"strings"
)

var customMIMETypes = map[string]string{
	".jpg":  "image/jpeg",
	".jpeg": "image/jpeg",
	".png":  "image/png",
	".gif":  "image/gif",
	".svg":  "image/svg+xml",
	".webp": "image/webp",
	".pdf":  "application/pdf",
	".eps":  "application/postscript",
	".html": "text/html; charset=utf-8",
	".htm":  "text/html; charset=utf-8",
	".css":  "text/css",
	".js":   "application/javascript",
	".json": "application/json",
	".xml":  "application/xml",
	".txt":  "text/plain; charset=utf-8",
	".csv":  "text/csv; charset=utf-8",
	".tsv":  "text/tab-separated-values; charset=utf-8",
	".log":  "text/plain; charset=utf-8",
	".md":   "text/plain; charset=utf-8",
	".yaml": "text/plain; charset=utf-8",
	".yml":  "text/plain; charset=utf-8",
	".toml": "text/plain; charset=utf-8",
}

// mimeTypeForFile returns the MIME type for a given filename.
func mimeTypeForFile(name string) string {
	ext := strings.ToLower(filepath.Ext(name))
	if ct, ok := customMIMETypes[ext]; ok {
		return ct
	}
	if ct := mime.TypeByExtension(ext); ct != "" {
		return ct
	}
	return "application/octet-stream"
}

// isTextFile returns true if the file extension indicates a text file
// that supports clipboard copy.
var textExtensions = map[string]bool{
	".txt": true, ".tsv": true, ".csv": true, ".log": true,
	".md": true, ".yaml": true, ".yml": true, ".toml": true,
	".json": true, ".xml": true, ".html": true, ".css": true, ".js": true,
}

func isTextFile(name string) bool {
	ext := strings.ToLower(filepath.Ext(name))
	return textExtensions[ext]
}

// isImageFile returns true if the file extension is an image type.
var imageExtensions = map[string]bool{
	".jpg": true, ".jpeg": true, ".png": true, ".gif": true,
	".svg": true, ".webp": true, ".eps": true,
}

func isImageFile(name string) bool {
	ext := strings.ToLower(filepath.Ext(name))
	return imageExtensions[ext]
}
