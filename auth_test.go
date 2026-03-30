package main

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestHashPassword(t *testing.T) {
	// SHA-256 of "test" is known
	hash := hashPassword("test")
	expected := "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08"
	if hash != expected {
		t.Errorf("expected %s, got %s", expected, hash)
	}
}

func TestAuthState_SessionLifecycle(t *testing.T) {
	auth := newAuthState(true, "somehash")

	// Create session
	token := auth.createSession()
	if token == "" {
		t.Fatal("expected non-empty token")
	}
	if len(token) != 64 { // 32 bytes = 64 hex chars
		t.Errorf("expected 64 char token, got %d", len(token))
	}

	// Validate session
	if !auth.validateSession(token) {
		t.Error("expected session to be valid")
	}

	// Invalid token
	if auth.validateSession("invalid") {
		t.Error("expected invalid token to fail")
	}

	// Empty token
	if auth.validateSession("") {
		t.Error("expected empty token to fail")
	}

	// Delete session
	auth.deleteSession(token)
	if auth.validateSession(token) {
		t.Error("expected deleted session to be invalid")
	}
}

func TestAuthState_CheckPassword(t *testing.T) {
	passwordHash := hashPassword("mypassword")
	auth := newAuthState(true, passwordHash)

	if !auth.checkPassword(passwordHash) {
		t.Error("expected correct password to match")
	}

	wrongHash := hashPassword("wrongpassword")
	if auth.checkPassword(wrongHash) {
		t.Error("expected wrong password to fail")
	}

	if auth.checkPassword("") {
		t.Error("expected empty hash to fail")
	}
}

func TestAuthMiddleware_Disabled(t *testing.T) {
	auth := newAuthState(false, "")
	handler := authMiddleware(auth, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))

	req := httptest.NewRequest("GET", "/", nil)
	w := httptest.NewRecorder()
	handler.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", w.Code)
	}
}

func TestAuthMiddleware_NoSession_HTMLRedirect(t *testing.T) {
	auth := newAuthState(true, hashPassword("test"))
	handler := authMiddleware(auth, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))

	req := httptest.NewRequest("GET", "/", nil)
	req.Header.Set("Accept", "text/html,application/xhtml+xml")
	w := httptest.NewRecorder()
	handler.ServeHTTP(w, req)

	if w.Code != http.StatusFound {
		t.Errorf("expected 302 redirect, got %d", w.Code)
	}
	if loc := w.Header().Get("Location"); loc != "/login" {
		t.Errorf("expected redirect to /login, got %s", loc)
	}
}

func TestAuthMiddleware_NoSession_APIUnauthorized(t *testing.T) {
	auth := newAuthState(true, hashPassword("test"))
	handler := authMiddleware(auth, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))

	req := httptest.NewRequest("GET", "/api/lsdir/", nil)
	req.Header.Set("Accept", "application/json")
	w := httptest.NewRecorder()
	handler.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Errorf("expected 401, got %d", w.Code)
	}
}

func TestAuthMiddleware_ValidSession(t *testing.T) {
	auth := newAuthState(true, hashPassword("test"))
	token := auth.createSession()

	handler := authMiddleware(auth, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))

	req := httptest.NewRequest("GET", "/", nil)
	req.AddCookie(&http.Cookie{Name: "catscope_session", Value: token})
	w := httptest.NewRecorder()
	handler.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", w.Code)
	}
}

func TestAuthMiddleware_ExemptPaths(t *testing.T) {
	auth := newAuthState(true, hashPassword("test"))
	handler := authMiddleware(auth, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))

	exemptPaths := []string{"/login", "/assets/css/style.css", "/assets/js/app.js"}
	for _, path := range exemptPaths {
		req := httptest.NewRequest("GET", path, nil)
		w := httptest.NewRecorder()
		handler.ServeHTTP(w, req)

		if w.Code != http.StatusOK {
			t.Errorf("path %s: expected 200, got %d", path, w.Code)
		}
	}
}

func TestHandleLoginSubmit_Success(t *testing.T) {
	passwordHash := hashPassword("testpass")
	auth := newAuthState(true, passwordHash)

	handler := handleLoginSubmit(auth)
	body := `{"passwordHash":"` + passwordHash + `"}`
	req := httptest.NewRequest("POST", "/login", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	handler.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", w.Code)
	}

	// Check Set-Cookie header
	cookies := w.Result().Cookies()
	found := false
	for _, c := range cookies {
		if c.Name == "catscope_session" && c.Value != "" {
			found = true
			break
		}
	}
	if !found {
		t.Error("expected catscope_session cookie to be set")
	}

	var resp map[string]bool
	json.NewDecoder(w.Body).Decode(&resp)
	if !resp["ok"] {
		t.Error("expected ok:true in response")
	}
}

func TestHandleLoginSubmit_Failure(t *testing.T) {
	auth := newAuthState(true, hashPassword("correct"))

	handler := handleLoginSubmit(auth)
	body := `{"passwordHash":"` + hashPassword("wrong") + `"}`
	req := httptest.NewRequest("POST", "/login", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	handler.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Errorf("expected 401, got %d", w.Code)
	}
}

func TestHandleLogout(t *testing.T) {
	auth := newAuthState(true, hashPassword("test"))
	token := auth.createSession()

	handler := handleLogout(auth)
	req := httptest.NewRequest("POST", "/logout", nil)
	req.AddCookie(&http.Cookie{Name: "catscope_session", Value: token})
	w := httptest.NewRecorder()
	handler.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", w.Code)
	}

	// Session should be deleted
	if auth.validateSession(token) {
		t.Error("expected session to be deleted after logout")
	}

	// Cookie should be cleared
	cookies := w.Result().Cookies()
	for _, c := range cookies {
		if c.Name == "catscope_session" && c.MaxAge != -1 {
			t.Error("expected cookie MaxAge to be -1")
		}
	}
}
