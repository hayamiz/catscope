package main

import (
	"strings"
	"testing"
)

func TestBannerContent(t *testing.T) {
	if banner == "" {
		t.Fatal("expected banner to be non-empty")
	}
	// The banner renders "Catscope" as ASCII art using box-drawing characters,
	// so the literal word "catscope" is not present. Instead we check for the
	// cat-face motif that is catscope's signature.
	if !strings.Contains(banner, "=^..^=") {
		t.Errorf("expected banner to contain cat face '=^..^=', got:\n%s", banner)
	}
}
