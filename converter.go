package main

import (
	"bytes"
	"fmt"
	"math"
	"os/exec"
	"strconv"
	"strings"
)

const pixelThreshold = 524288

// hasImageMagick checks if the convert command is available.
func hasImageMagick() bool {
	_, err := exec.LookPath("convert")
	return err == nil
}

// getImageDimensions uses identify to get width and height of an image.
func getImageDimensions(path string) (int, int, error) {
	cmd := exec.Command("identify", "-format", "%w %h", path)
	out, err := cmd.Output()
	if err != nil {
		return 0, 0, fmt.Errorf("identify failed: %w", err)
	}
	parts := strings.Fields(strings.TrimSpace(string(out)))
	if len(parts) < 2 {
		return 0, 0, fmt.Errorf("unexpected identify output: %s", string(out))
	}
	w, err := strconv.Atoi(parts[0])
	if err != nil {
		return 0, 0, fmt.Errorf("parse width: %w", err)
	}
	h, err := strconv.Atoi(parts[1])
	if err != nil {
		return 0, 0, fmt.Errorf("parse height: %w", err)
	}
	return w, h, nil
}

// convertEPSToPNG converts an EPS file to PNG using ImageMagick.
// Returns the PNG data or an error.
func convertEPSToPNG(path string) ([]byte, error) {
	if !hasImageMagick() {
		return nil, errImageMagickUnavailable
	}

	args := []string{}

	w, h, err := getImageDimensions(path)
	if err == nil {
		pixels := w * h
		if pixels > 0 && pixels < pixelThreshold {
			dpi := int(math.Floor(72 * math.Sqrt(float64(pixelThreshold)/float64(pixels))))
			args = append(args, "-density", strconv.Itoa(dpi))
		}
	}
	// If identify fails, convert without DPI specification

	args = append(args, path, "png:-")

	cmd := exec.Command("convert", args...)
	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr

	if err := cmd.Run(); err != nil {
		return nil, fmt.Errorf("convert failed: %s: %w", stderr.String(), err)
	}

	return stdout.Bytes(), nil
}

var errImageMagickUnavailable = fmt.Errorf("ImageMagick is not installed")
