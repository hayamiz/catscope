package main

import (
	"fmt"
	"path/filepath"
)

// resolvePath resolves a URL path to an absolute filesystem path within topDir.
// It strips the leading "/", joins with topDir, and canonicalizes.
// Returns an error if the resolved path is outside topDir.
func resolvePath(topDir, urlPath string) (string, error) {
	joined := filepath.Join(topDir, urlPath)

	abs, err := filepath.Abs(joined)
	if err != nil {
		return "", fmt.Errorf("failed to resolve absolute path: %w", err)
	}

	resolved, err := filepath.EvalSymlinks(abs)
	if err != nil {
		return "", err
	}

	if !isInsideDir(resolved, topDir) {
		return "", errPathOutsideTopDir
	}

	return resolved, nil
}

// isInsideDir checks if path is inside dir (or is dir itself).
func isInsideDir(path, dir string) bool {
	if path == dir {
		return true
	}
	prefix := dir + string(filepath.Separator)
	return len(path) > len(prefix) && path[:len(prefix)] == prefix
}

var errPathOutsideTopDir = fmt.Errorf("path is outside the serving directory")
