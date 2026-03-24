package main

import (
	"testing"
)

func TestHasImageMagick(t *testing.T) {
	// Just verify it doesn't panic
	_ = hasImageMagick()
}

func TestConvertEPSToPNG_NoImageMagick(t *testing.T) {
	if hasImageMagick() {
		t.Skip("ImageMagick is installed, skipping unavailable test")
	}
	_, err := convertEPSToPNG("/tmp/nonexistent.eps")
	if err == nil {
		t.Error("expected error when ImageMagick is not available")
	}
}

func TestPixelThreshold(t *testing.T) {
	if pixelThreshold != 524288 {
		t.Errorf("expected threshold 524288, got %d", pixelThreshold)
	}
}
