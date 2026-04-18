package main

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/alecthomas/chroma/v2"
	chromahtml "github.com/alecthomas/chroma/v2/formatters/html"
	"github.com/alecthomas/chroma/v2/lexers"
	"github.com/alecthomas/chroma/v2/styles"
	"github.com/microcosm-cc/bluemonday"
	"github.com/yuin/goldmark"
)

const maxRenderSize = 10 * 1024 * 1024 // 10 MB

func handleRender(topDir string) http.HandlerFunc {
	md := goldmark.New()
	sanitizer := bluemonday.UGCPolicy()

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

		if info.Size() > maxRenderSize {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusRequestEntityTooLarge)
			json.NewEncoder(w).Encode(map[string]string{
				"error":   "file_too_large",
				"message": fmt.Sprintf("File size (%d bytes) exceeds the 10 MB render limit.", info.Size()),
			})
			return
		}

		data, err := os.ReadFile(resolved)
		if err != nil {
			http.Error(w, "internal error", http.StatusInternalServerError)
			return
		}

		ext := strings.ToLower(filepath.Ext(resolved))
		var rendered string

		switch ext {
		case ".md":
			rendered, err = renderMarkdown(md, sanitizer, data)
		case ".json":
			rendered, err = renderJSON(data)
		case ".yaml", ".yml":
			rendered = renderPlainWrapped(data, "yaml")
		default:
			rendered, err = renderSyntaxHighlighted(resolved, data)
		}

		if err != nil {
			http.Error(w, "render failed", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		w.Write([]byte(wrapHTML(rendered)))
	}
}

func renderMarkdown(md goldmark.Markdown, sanitizer *bluemonday.Policy, data []byte) (string, error) {
	var buf bytes.Buffer
	if err := md.Convert(data, &buf); err != nil {
		return "", err
	}
	return sanitizer.Sanitize(buf.String()), nil
}

func renderJSON(data []byte) (string, error) {
	var buf bytes.Buffer
	if err := json.Indent(&buf, data, "", "  "); err != nil {
		return "<pre>" + htmlEscape(string(data)) + "</pre>", nil
	}
	return "<pre>" + htmlEscape(buf.String()) + "</pre>", nil
}

func renderPlainWrapped(data []byte, lang string) string {
	return "<pre><code class=\"language-" + lang + "\">" + htmlEscape(string(data)) + "</code></pre>"
}

func renderSyntaxHighlighted(filename string, data []byte) (string, error) {
	lexer := lexers.Match(filename)
	if lexer == nil {
		lexer = lexers.Fallback
	}
	lexer = chroma.Coalesce(lexer)

	style := styles.Get("github")
	formatter := chromahtml.New(chromahtml.WithClasses(true))

	iterator, err := lexer.Tokenise(nil, string(data))
	if err != nil {
		return "<pre>" + htmlEscape(string(data)) + "</pre>", nil
	}

	var buf bytes.Buffer
	if err := formatter.Format(&buf, style, iterator); err != nil {
		return "<pre>" + htmlEscape(string(data)) + "</pre>", nil
	}

	var cssBuf bytes.Buffer
	if err := formatter.WriteCSS(&cssBuf, style); err == nil {
		return "<style>" + cssBuf.String() + "</style>" + buf.String(), nil
	}

	return buf.String(), nil
}

func wrapHTML(body string) string {
	return `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>
body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 16px; line-height: 1.6; color: #333; }
pre { background: #f6f8fa; padding: 12px; border-radius: 4px; overflow-x: auto; font-size: 13px; }
code { font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace; font-size: 13px; }
table { border-collapse: collapse; margin: 8px 0; }
th, td { border: 1px solid #ddd; padding: 6px 12px; }
th { background: #f0f0f0; }
blockquote { border-left: 4px solid #ddd; margin: 0; padding: 0 16px; color: #666; }
img { max-width: 100%; }
h1, h2, h3, h4, h5, h6 { margin-top: 24px; margin-bottom: 8px; }
a { color: #008CBA; }
</style>
</head><body>` + body + `</body></html>`
}

func htmlEscape(s string) string {
	var buf bytes.Buffer
	_ = writeHTMLEscaped(&buf, s)
	return buf.String()
}

func writeHTMLEscaped(w io.Writer, s string) error {
	for _, r := range s {
		switch r {
		case '&':
			fmt.Fprint(w, "&amp;")
		case '<':
			fmt.Fprint(w, "&lt;")
		case '>':
			fmt.Fprint(w, "&gt;")
		case '"':
			fmt.Fprint(w, "&quot;")
		default:
			fmt.Fprintf(w, "%c", r)
		}
	}
	return nil
}
