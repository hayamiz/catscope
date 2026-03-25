package main

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"strings"
)

const releaseURL = "https://github.com/hayamiz/catscope/releases/latest/download/catscope-linux-amd64"

// selfUpdate updates the running binary in-place to the latest release.
func selfUpdate() error {
	// 1. Determine the absolute path of the running binary via /proc/<PID>/exe
	exePath, err := os.Readlink("/proc/" + strconv.Itoa(os.Getpid()) + "/exe")
	if err != nil {
		return fmt.Errorf("failed to resolve binary path: %w", err)
	}

	// 2. Check that the binary is writable
	if err := checkWritable(exePath); err != nil {
		return fmt.Errorf("cannot update %s: permission denied", exePath)
	}

	// Preserve original file permissions
	info, err := os.Stat(exePath)
	if err != nil {
		return fmt.Errorf("failed to stat %s: %w", exePath, err)
	}
	origPerm := info.Mode().Perm()

	// 3. Fetch the latest release binary
	fmt.Println("Downloading latest release...")
	resp, err := http.Get(releaseURL)
	if err != nil {
		return fmt.Errorf("failed to download update: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("download failed: HTTP %d", resp.StatusCode)
	}

	// 4. Write to a temporary file in the same directory, then atomically rename
	dir := filepath.Dir(exePath)
	tmpFile, err := os.CreateTemp(dir, ".catscope-update-*")
	if err != nil {
		return fmt.Errorf("failed to create temporary file: %w", err)
	}
	tmpPath := tmpFile.Name()

	// Clean up temp file on any error
	defer func() {
		if tmpPath != "" {
			os.Remove(tmpPath)
		}
	}()

	if _, err := io.Copy(tmpFile, resp.Body); err != nil {
		tmpFile.Close()
		return fmt.Errorf("failed to write update: %w", err)
	}
	if err := tmpFile.Close(); err != nil {
		return fmt.Errorf("failed to close temporary file: %w", err)
	}

	// 5. Preserve original permissions
	if err := os.Chmod(tmpPath, origPerm); err != nil {
		return fmt.Errorf("failed to set permissions: %w", err)
	}

	// Atomic rename
	if err := os.Rename(tmpPath, exePath); err != nil {
		return fmt.Errorf("failed to replace binary: %w", err)
	}
	tmpPath = "" // prevent deferred cleanup

	// 6. Print the updated version
	newVersion, err := getNewVersion(exePath)
	if err != nil {
		fmt.Println("Updated catscope successfully")
	} else {
		fmt.Printf("Updated catscope to %s\n", newVersion)
	}

	return nil
}

// checkWritable checks if the file at path is writable by the current user.
// It checks the parent directory's write permission (needed for atomic rename)
// rather than opening the binary itself (which fails with ETXTBSY on Linux
// while the binary is running).
func checkWritable(path string) error {
	dir := filepath.Dir(path)
	tmpFile, err := os.CreateTemp(dir, ".catscope-write-check-*")
	if err != nil {
		return err
	}
	name := tmpFile.Name()
	tmpFile.Close()
	os.Remove(name)
	return nil
}

// getNewVersion runs the updated binary with --version and extracts the version string.
func getNewVersion(exePath string) (string, error) {
	out, err := exec.Command(exePath, "--version").Output()
	if err != nil {
		return "", err
	}
	// Output is "Catscope vX.Y.Z\n"
	return strings.TrimSpace(string(out)), nil
}
