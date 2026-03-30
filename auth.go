package main

import (
	"crypto/rand"
	"crypto/sha256"
	"crypto/subtle"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"html/template"
	"log/slog"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"

	"golang.org/x/term"
)

type authState struct {
	enabled      bool
	passwordHash string // hex-encoded SHA-256
	sessions     map[string]time.Time
	mu           sync.Mutex
}

func newAuthState(enabled bool, passwordHash string) *authState {
	return &authState{
		enabled:      enabled,
		passwordHash: passwordHash,
		sessions:     make(map[string]time.Time),
	}
}

func hashPassword(password string) string {
	h := sha256.Sum256([]byte(password))
	return hex.EncodeToString(h[:])
}

func promptPassword() (string, error) {
	fmt.Fprint(os.Stderr, "Enter password: ")
	pw1, err := term.ReadPassword(int(os.Stdin.Fd()))
	fmt.Fprintln(os.Stderr)
	if err != nil {
		return "", fmt.Errorf("failed to read password: %w", err)
	}
	if len(pw1) == 0 {
		return "", fmt.Errorf("password cannot be empty")
	}

	fmt.Fprint(os.Stderr, "Confirm password: ")
	pw2, err := term.ReadPassword(int(os.Stdin.Fd()))
	fmt.Fprintln(os.Stderr)
	if err != nil {
		return "", fmt.Errorf("failed to read password: %w", err)
	}

	if string(pw1) != string(pw2) {
		return "", fmt.Errorf("passwords do not match")
	}

	return hashPassword(string(pw1)), nil
}

func (a *authState) createSession() string {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		panic("failed to generate random bytes: " + err.Error())
	}
	token := hex.EncodeToString(b)

	a.mu.Lock()
	a.sessions[token] = time.Now()
	a.mu.Unlock()

	return token
}

func (a *authState) validateSession(token string) bool {
	if token == "" {
		return false
	}
	a.mu.Lock()
	_, ok := a.sessions[token]
	a.mu.Unlock()
	return ok
}

func (a *authState) deleteSession(token string) {
	a.mu.Lock()
	delete(a.sessions, token)
	a.mu.Unlock()
}

func (a *authState) checkPassword(clientHash string) bool {
	return subtle.ConstantTimeCompare([]byte(clientHash), []byte(a.passwordHash)) == 1
}

func authMiddleware(auth *authState, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if !auth.enabled {
			next.ServeHTTP(w, r)
			return
		}

		path := r.URL.Path

		// Exempt paths needed for login
		if path == "/login" || strings.HasPrefix(path, "/assets/") {
			next.ServeHTTP(w, r)
			return
		}

		// Check session cookie
		cookie, err := r.Cookie("catscope_session")
		if err == nil && auth.validateSession(cookie.Value) {
			next.ServeHTTP(w, r)
			return
		}

		// Not authenticated
		accept := r.Header.Get("Accept")
		if strings.Contains(accept, "text/html") {
			http.Redirect(w, r, "/login", http.StatusFound)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]string{"error": "authentication required"})
	})
}

func handleLoginPage(auth *authState) http.HandlerFunc {
	data, err := frontendFS.ReadFile("frontend/login.html")
	if err != nil {
		slog.Error("failed to read login.html", "error", err)
	}
	tmpl, err := template.New("login").Parse(string(data))
	if err != nil {
		slog.Error("failed to parse login.html template", "error", err)
	}

	return func(w http.ResponseWriter, r *http.Request) {
		if !auth.enabled {
			http.Redirect(w, r, "/", http.StatusFound)
			return
		}

		// Already authenticated? Redirect to main page
		cookie, err := r.Cookie("catscope_session")
		if err == nil && auth.validateSession(cookie.Value) {
			http.Redirect(w, r, "/", http.StatusFound)
			return
		}

		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		tmpl.Execute(w, nil)
	}
}

func handleLoginSubmit(auth *authState) http.HandlerFunc {
	type loginRequest struct {
		PasswordHash string `json:"passwordHash"`
	}

	return func(w http.ResponseWriter, r *http.Request) {
		if !auth.enabled {
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]bool{"ok": true})
			return
		}

		var req loginRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{"error": "invalid request"})
			return
		}

		if !auth.checkPassword(req.PasswordHash) {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusUnauthorized)
			json.NewEncoder(w).Encode(map[string]string{"error": "invalid password"})
			return
		}

		token := auth.createSession()
		http.SetCookie(w, &http.Cookie{
			Name:     "catscope_session",
			Value:    token,
			Path:     "/",
			HttpOnly: true,
			SameSite: http.SameSiteStrictMode,
		})

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]bool{"ok": true})
	}
}

func handleLogout(auth *authState) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		cookie, err := r.Cookie("catscope_session")
		if err == nil {
			auth.deleteSession(cookie.Value)
		}

		http.SetCookie(w, &http.Cookie{
			Name:     "catscope_session",
			Value:    "",
			Path:     "/",
			HttpOnly: true,
			SameSite: http.SameSiteStrictMode,
			MaxAge:   -1,
		})

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]bool{"ok": true})
	}
}
