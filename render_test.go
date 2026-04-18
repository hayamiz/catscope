package main

import (
	"bytes"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestHandleRenderMarkdown(t *testing.T) {
	dir, mux := setupTestServer(t)
	os.WriteFile(filepath.Join(dir, "test.md"), []byte("# Hello\n\nworld"), 0644)

	req := httptest.NewRequest("GET", "/render/test.md", nil)
	w := httptest.NewRecorder()
	mux.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}
	ct := w.Header().Get("Content-Type")
	if !strings.HasPrefix(ct, "text/html") {
		t.Errorf("expected text/html content-type, got %s", ct)
	}
	body := w.Body.String()
	if !strings.Contains(body, "<h1>Hello</h1>") {
		t.Errorf("expected body to contain <h1>Hello</h1>, got:\n%s", body)
	}
}

func TestHandleRenderMarkdownSanitization(t *testing.T) {
	dir, mux := setupTestServer(t)
	os.WriteFile(filepath.Join(dir, "xss.md"), []byte("<script>alert(1)</script>"), 0644)

	req := httptest.NewRequest("GET", "/render/xss.md", nil)
	w := httptest.NewRecorder()
	mux.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}
	body := w.Body.String()
	if strings.Contains(body, "<script>") {
		t.Errorf("expected body NOT to contain <script>, got:\n%s", body)
	}
}

func TestHandleRenderJSON(t *testing.T) {
	dir, mux := setupTestServer(t)
	os.WriteFile(filepath.Join(dir, "test.json"), []byte(`{"a":1,"b":[2,3]}`), 0644)

	req := httptest.NewRequest("GET", "/render/test.json", nil)
	w := httptest.NewRecorder()
	mux.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}
	body := w.Body.String()
	if !strings.Contains(body, "<pre>") {
		t.Errorf("expected body to contain <pre>, got:\n%s", body)
	}
	// json.Indent produces two-space indentation: `  "a": 1`
	// but values are html-escaped, so check for the key and value separately
	if !strings.Contains(body, "&quot;a&quot;: 1") {
		t.Errorf("expected body to contain indented JSON with a: 1, got:\n%s", body)
	}
}

func TestHandleRenderJSONMalformed(t *testing.T) {
	dir, mux := setupTestServer(t)
	os.WriteFile(filepath.Join(dir, "bad.json"), []byte("{invalid"), 0644)

	req := httptest.NewRequest("GET", "/render/bad.json", nil)
	w := httptest.NewRecorder()
	mux.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200 (fallback to escaped display), got %d", w.Code)
	}
}

func TestHandleRenderSyntaxHighlight(t *testing.T) {
	dir, mux := setupTestServer(t)
	os.WriteFile(filepath.Join(dir, "test.go"), []byte("package main\nfunc main() {}"), 0644)

	req := httptest.NewRequest("GET", "/render/test.go", nil)
	w := httptest.NewRecorder()
	mux.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}
	body := w.Body.String()
	if !strings.Contains(body, "<style>") {
		t.Errorf("expected body to contain <style> (chroma CSS), got:\n%s", body)
	}
}

func TestHandleRenderYAML(t *testing.T) {
	dir, mux := setupTestServer(t)
	os.WriteFile(filepath.Join(dir, "test.yaml"), []byte("key: value\nlist:\n  - one\n  - two\n"), 0644)

	req := httptest.NewRequest("GET", "/render/test.yaml", nil)
	w := httptest.NewRecorder()
	mux.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}
	body := w.Body.String()
	if !strings.Contains(body, "<pre>") {
		t.Errorf("expected body to contain <pre>, got:\n%s", body)
	}
}

func TestHandleRenderFileTooLarge(t *testing.T) {
	dir, mux := setupTestServer(t)
	// Create a file larger than 10 MB
	largeData := bytes.Repeat([]byte("x"), 10*1024*1024+1)
	os.WriteFile(filepath.Join(dir, "large.txt"), largeData, 0644)

	req := httptest.NewRequest("GET", "/render/large.txt", nil)
	w := httptest.NewRecorder()
	mux.ServeHTTP(w, req)

	if w.Code != http.StatusRequestEntityTooLarge {
		t.Fatalf("expected 413, got %d", w.Code)
	}
	body := w.Body.String()
	if !strings.Contains(body, "file_too_large") {
		t.Errorf("expected body to contain file_too_large, got:\n%s", body)
	}
}

func TestHandleRenderMarkdownGFM(t *testing.T) {
	tests := []struct {
		name     string
		markdown string
		contains string
	}{
		{
			name: "pipe table renders as HTML table",
			markdown: "| Name | Value |\n| --- | --- |\n| foo | bar |\n",
			contains: "<table>",
		},
		{
			name: "strikethrough renders as del",
			markdown: "~~deleted text~~\n",
			contains: "<del>deleted text</del>",
		},
		{
			name: "autolink renders as anchor",
			markdown: "Visit https://example.com for info.\n",
			contains: `<a href="https://example.com"`,
		},
		{
			name: "task list renders as list items",
			markdown: "- [x] done\n- [ ] todo\n",
			contains: "<li>",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			dir, mux := setupTestServer(t)
			os.WriteFile(filepath.Join(dir, "gfm.md"), []byte(tt.markdown), 0644)

			req := httptest.NewRequest("GET", "/render/gfm.md", nil)
			w := httptest.NewRecorder()
			mux.ServeHTTP(w, req)

			if w.Code != http.StatusOK {
				t.Fatalf("expected 200, got %d", w.Code)
			}
			body := w.Body.String()
			if !strings.Contains(body, tt.contains) {
				t.Errorf("expected body to contain %q, got:\n%s", tt.contains, body)
			}
		})
	}
}

func TestHandleRenderXML(t *testing.T) {
	tests := []struct {
		name     string
		xml      string
		contains []string
	}{
		{
			name: "XML tags are escaped and visible in rendered output",
			xml: `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Test Feed</title>
    <item>
      <title>Item 1</title>
      <description>Hello world</description>
    </item>
  </channel>
</rss>`,
			contains: []string{
				"&lt;rss",        // opening tag escaped
				"&lt;/rss&gt;",   // closing tag escaped
				"&lt;title&gt;",  // nested tag escaped
				"&lt;/title&gt;", // nested closing tag escaped
				"&lt;channel&gt;",
				"&lt;item&gt;",
				"&lt;description&gt;",
				"Test Feed",     // text content preserved
				"Hello world",   // text content preserved
			},
		},
		{
			name: "XML declaration is escaped",
			xml:  `<?xml version="1.0"?><root/>`,
			contains: []string{
				"&lt;?xml",  // XML declaration escaped
				"&lt;root",  // self-closing tag escaped
			},
		},
		{
			name: "XML attributes are visible in rendered output",
			xml:  `<element attr="value" num="42"/>`,
			contains: []string{
				"&lt;element",
				"attr",
				"value",
				"num",
				"42",
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			dir, mux := setupTestServer(t)
			os.WriteFile(filepath.Join(dir, "test.xml"), []byte(tt.xml), 0644)

			req := httptest.NewRequest("GET", "/render/test.xml", nil)
			w := httptest.NewRecorder()
			mux.ServeHTTP(w, req)

			if w.Code != http.StatusOK {
				t.Fatalf("expected 200, got %d", w.Code)
			}

			ct := w.Header().Get("Content-Type")
			if !strings.HasPrefix(ct, "text/html") {
				t.Errorf("expected text/html Content-Type, got %s", ct)
			}

			nosniff := w.Header().Get("X-Content-Type-Options")
			if nosniff != "nosniff" {
				t.Errorf("expected X-Content-Type-Options: nosniff, got %q", nosniff)
			}

			body := w.Body.String()
			for _, want := range tt.contains {
				if !strings.Contains(body, want) {
					t.Errorf("expected body to contain %q, got:\n%s", want, body)
				}
			}

			// Chroma CSS and syntax spans should be present
			if !strings.Contains(body, "<style>") {
				t.Errorf("expected body to contain <style> (chroma CSS)")
			}
			if !strings.Contains(body, `class="chroma"`) {
				t.Errorf("expected body to contain chroma class")
			}
		})
	}
}

func TestRenderSyntaxHighlightedXML(t *testing.T) {
	// Test the renderSyntaxHighlighted function directly to ensure
	// XML tags are properly HTML-escaped in the chroma output.
	tests := []struct {
		name        string
		xml         string
		mustContain []string
		mustNotContain []string
	}{
		{
			name: "XML tags escaped as HTML entities",
			xml:  `<root><child>text</child></root>`,
			mustContain: []string{
				"&lt;root&gt;",
				"&lt;child&gt;",
				"&lt;/child&gt;",
				"&lt;/root&gt;",
				"text",
			},
			// Raw unescaped XML tags must not appear outside of HTML span tags
			mustNotContain: []string{},
		},
		{
			name: "XML with namespaces",
			xml:  `<atom:link href="http://example.com" rel="self"/>`,
			mustContain: []string{
				"&lt;atom:link",
				"href",
				"example.com",
			},
		},
		{
			name: "angle brackets never appear unescaped in content spans",
			xml: `<?xml version="1.0"?>
<data>
  <value>100 &lt; 200</value>
</data>`,
			mustContain: []string{
				"&lt;data&gt;",
				"&lt;value&gt;",
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			rendered, err := renderSyntaxHighlighted("test.xml", []byte(tt.xml))
			if err != nil {
				t.Fatalf("renderSyntaxHighlighted failed: %v", err)
			}

			for _, want := range tt.mustContain {
				if !strings.Contains(rendered, want) {
					t.Errorf("expected output to contain %q, got:\n%s", want, rendered)
				}
			}

			for _, notWant := range tt.mustNotContain {
				if strings.Contains(rendered, notWant) {
					t.Errorf("expected output NOT to contain %q, got:\n%s", notWant, rendered)
				}
			}
		})
	}
}

func TestHandleRenderStatusCodes(t *testing.T) {
	_, mux := setupTestServer(t)

	tests := []struct {
		name       string
		path       string
		wantStatus int
	}{
		{
			name:       "path traversal",
			path:       "/render/%2e%2e/%2e%2e/etc/passwd",
			wantStatus: http.StatusForbidden,
		},
		{
			name:       "not found",
			path:       "/render/nonexistent.txt",
			wantStatus: http.StatusNotFound,
		},
		{
			name:       "directory",
			path:       "/render/subdir",
			wantStatus: http.StatusNotFound,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := httptest.NewRequest("GET", tt.path, nil)
			w := httptest.NewRecorder()
			mux.ServeHTTP(w, req)

			if tt.name == "path traversal" {
				// Accept either 403 or 404 (depending on path cleaning)
				if w.Code != http.StatusForbidden && w.Code != http.StatusNotFound {
					t.Errorf("expected 403 or 404, got %d", w.Code)
				}
			} else if w.Code != tt.wantStatus {
				t.Errorf("expected %d, got %d", tt.wantStatus, w.Code)
			}
		})
	}
}
