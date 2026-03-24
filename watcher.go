package main

import (
	"context"
	"encoding/json"
	"log/slog"
	"net/http"
	"path/filepath"
	"sync"
	"time"

	"github.com/fsnotify/fsnotify"
	"nhooyr.io/websocket"
)

type wsMessage struct {
	Type string `json:"type"`
	Path string `json:"path"`
}

type watcherHub struct {
	mu          sync.Mutex
	fsWatcher   *fsnotify.Watcher
	clients     map[*wsClient]struct{}
	refCounts   map[string]int          // absolute path -> reference count
	pathToRel   map[string]string       // absolute path -> relative path
	debounce    map[string]*time.Timer  // absolute path -> debounce timer
}

type wsClient struct {
	conn    *websocket.Conn
	hub     *watcherHub
	watched map[string]struct{} // absolute paths this client watches
	mu      sync.Mutex
}

func newWatcherHub() *watcherHub {
	w, err := fsnotify.NewWatcher()
	if err != nil {
		slog.Error("failed to create fsnotify watcher", "error", err)
		panic(err)
	}

	hub := &watcherHub{
		fsWatcher: w,
		clients:   make(map[*wsClient]struct{}),
		refCounts: make(map[string]int),
		pathToRel: make(map[string]string),
		debounce:  make(map[string]*time.Timer),
	}

	go hub.eventLoop()
	return hub
}

func (h *watcherHub) close() {
	h.fsWatcher.Close()
}

func (h *watcherHub) eventLoop() {
	for {
		select {
		case event, ok := <-h.fsWatcher.Events:
			if !ok {
				return
			}
			h.handleFSEvent(event)
		case err, ok := <-h.fsWatcher.Errors:
			if !ok {
				return
			}
			slog.Error("fsnotify error", "error", err)
		}
	}
}

func (h *watcherHub) handleFSEvent(event fsnotify.Event) {
	absPath := event.Name

	h.mu.Lock()
	relPath, exists := h.pathToRel[absPath]
	if !exists {
		h.mu.Unlock()
		return
	}

	// Debounce: cancel previous timer and set a new one
	if timer, ok := h.debounce[absPath]; ok {
		timer.Stop()
	}

	var msgType string
	switch {
	case event.Op&fsnotify.Write != 0:
		msgType = "file_modified"
	case event.Op&fsnotify.Rename != 0:
		msgType = "file_renamed"
	case event.Op&fsnotify.Remove != 0:
		msgType = "file_deleted"
	default:
		h.mu.Unlock()
		return
	}

	h.debounce[absPath] = time.AfterFunc(100*time.Millisecond, func() {
		h.broadcast(absPath, wsMessage{Type: msgType, Path: relPath})
	})
	h.mu.Unlock()
}

func (h *watcherHub) broadcast(absPath string, msg wsMessage) {
	data, err := json.Marshal(msg)
	if err != nil {
		return
	}

	h.mu.Lock()
	defer h.mu.Unlock()

	for client := range h.clients {
		client.mu.Lock()
		_, watching := client.watched[absPath]
		client.mu.Unlock()
		if watching {
			ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
			err := client.conn.Write(ctx, websocket.MessageText, data)
			cancel()
			if err != nil {
				slog.Debug("failed to send ws message", "error", err)
			}
		}
	}
}

func (h *watcherHub) addWatch(absPath, relPath string) {
	h.mu.Lock()
	defer h.mu.Unlock()

	h.refCounts[absPath]++
	h.pathToRel[absPath] = relPath
	if h.refCounts[absPath] == 1 {
		if err := h.fsWatcher.Add(absPath); err != nil {
			slog.Error("failed to add watch", "path", absPath, "error", err)
		}
	}
}

func (h *watcherHub) removeWatch(absPath string) {
	h.mu.Lock()
	defer h.mu.Unlock()

	h.refCounts[absPath]--
	if h.refCounts[absPath] <= 0 {
		h.fsWatcher.Remove(absPath)
		delete(h.refCounts, absPath)
		delete(h.pathToRel, absPath)
		if timer, ok := h.debounce[absPath]; ok {
			timer.Stop()
			delete(h.debounce, absPath)
		}
	}
}

func (h *watcherHub) registerClient(c *wsClient) {
	h.mu.Lock()
	defer h.mu.Unlock()
	h.clients[c] = struct{}{}
}

func (h *watcherHub) unregisterClient(c *wsClient) {
	c.mu.Lock()
	watched := make([]string, 0, len(c.watched))
	for p := range c.watched {
		watched = append(watched, p)
	}
	c.watched = nil
	c.mu.Unlock()

	for _, p := range watched {
		h.removeWatch(p)
	}

	h.mu.Lock()
	delete(h.clients, c)
	h.mu.Unlock()
}

func handleWebSocket(topDir string, hub *watcherHub) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		conn, err := websocket.Accept(w, r, &websocket.AcceptOptions{
			InsecureSkipVerify: true,
		})
		if err != nil {
			slog.Error("websocket accept failed", "error", err)
			return
		}

		client := &wsClient{
			conn:    conn,
			hub:     hub,
			watched: make(map[string]struct{}),
		}
		hub.registerClient(client)
		defer hub.unregisterClient(client)

		ctx := r.Context()
		for {
			_, data, err := conn.Read(ctx)
			if err != nil {
				return
			}

			var msg wsMessage
			if err := json.Unmarshal(data, &msg); err != nil {
				slog.Debug("invalid ws message", "error", err)
				continue
			}

			switch msg.Type {
			case "watch":
				absPath, err := resolvePath(topDir, msg.Path)
				if err != nil {
					continue
				}
				// Watch the parent directory for file events
				parentDir := filepath.Dir(absPath)
				client.mu.Lock()
				client.watched[parentDir] = struct{}{}
				client.mu.Unlock()
				hub.addWatch(parentDir, msg.Path)

			case "unwatch":
				absPath, err := resolvePath(topDir, msg.Path)
				if err != nil {
					continue
				}
				parentDir := filepath.Dir(absPath)
				client.mu.Lock()
				delete(client.watched, parentDir)
				client.mu.Unlock()
				hub.removeWatch(parentDir)
			}
		}
	}
}
