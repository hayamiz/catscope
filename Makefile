VERSION := $(shell cat VERSION)
BINARY  := catscope
LDFLAGS := -s -w -X main.version=$(VERSION)

.PHONY: help build build-release build-release-linux \
        vet fmt fmt-fix lint \
        test test-cover test-e2e test-all \
        release run clean

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

build: ## Build binary (dev, no version)
	go build -o $(BINARY) .

build-release: ## Build binary with version embedded
	go build -ldflags="$(LDFLAGS)" -o $(BINARY) .

build-release-linux: ## Cross-build linux/amd64 release binary
	GOOS=linux GOARCH=amd64 go build -ldflags="$(LDFLAGS)" -o $(BINARY)-linux-amd64 .

vet: ## Run go vet
	go vet ./...

fmt: ## Check formatting (exits non-zero if unformatted)
	@test -z "$$(gofmt -l .)" || (gofmt -l . && exit 1)

fmt-fix: ## Auto-format all Go files
	gofmt -w .

lint: vet fmt ## Run vet + format check

test: ## Run Go unit tests
	go test ./...

test-cover: ## Run tests with coverage report (opens HTML)
	go test -coverprofile=coverage.out ./...
	go tool cover -html=coverage.out -o coverage.html
	@echo "Coverage report: coverage.html"

test-e2e: ## Run Playwright integration tests
	cd e2e && npm install && npx playwright test

test-all: test test-e2e ## Run all tests (unit + e2e)

release: ## Create GitHub release (interactive script)
	./scripts/create-release.sh

run: build ## Build and run the server
	./$(BINARY)

clean: ## Remove build artifacts
	rm -f $(BINARY) $(BINARY)-linux-amd64 coverage.out coverage.html
