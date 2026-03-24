package main

import (
	"os"
	"path/filepath"
	"testing"
	"time"
)

func TestWatcherHub_AddRemoveWatch(t *testing.T) {
	hub := newWatcherHub()
	defer hub.close()

	dir := t.TempDir()
	testFile := filepath.Join(dir, "test.txt")
	os.WriteFile(testFile, []byte("hello"), 0644)

	// Add watch
	hub.addWatch(dir, "test.txt")

	hub.mu.Lock()
	if hub.refCounts[dir] != 1 {
		t.Errorf("expected refcount 1, got %d", hub.refCounts[dir])
	}
	hub.mu.Unlock()

	// Add another watch for same path
	hub.addWatch(dir, "test.txt")

	hub.mu.Lock()
	if hub.refCounts[dir] != 2 {
		t.Errorf("expected refcount 2, got %d", hub.refCounts[dir])
	}
	hub.mu.Unlock()

	// Remove one watch
	hub.removeWatch(dir)

	hub.mu.Lock()
	if hub.refCounts[dir] != 1 {
		t.Errorf("expected refcount 1, got %d", hub.refCounts[dir])
	}
	hub.mu.Unlock()

	// Remove last watch
	hub.removeWatch(dir)

	hub.mu.Lock()
	if _, exists := hub.refCounts[dir]; exists {
		t.Error("expected path to be removed from refCounts")
	}
	hub.mu.Unlock()
}

func TestWatcherHub_FileModification(t *testing.T) {
	hub := newWatcherHub()
	defer hub.close()

	dir := t.TempDir()
	testFile := filepath.Join(dir, "test.txt")
	os.WriteFile(testFile, []byte("hello"), 0644)

	hub.addWatch(dir, "test.txt")

	// Modify the file
	os.WriteFile(testFile, []byte("world"), 0644)

	// Wait for debounce
	time.Sleep(200 * time.Millisecond)

	// Verify no panic occurred (basic smoke test)
}

func TestWatcherHub_UnregisterClient(t *testing.T) {
	hub := newWatcherHub()
	defer hub.close()

	dir := t.TempDir()
	os.WriteFile(filepath.Join(dir, "test.txt"), []byte("hello"), 0644)

	client := &wsClient{
		hub:     hub,
		watched: make(map[string]struct{}),
	}
	hub.registerClient(client)

	client.mu.Lock()
	client.watched[dir] = struct{}{}
	client.mu.Unlock()
	hub.addWatch(dir, "test.txt")

	// Unregister should cleanup
	hub.unregisterClient(client)

	hub.mu.Lock()
	if _, exists := hub.clients[client]; exists {
		t.Error("client should be removed")
	}
	if _, exists := hub.refCounts[dir]; exists {
		t.Error("watch should be cleaned up")
	}
	hub.mu.Unlock()
}
