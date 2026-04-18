BINARY   := catscope
VERSION  := $(shell cat VERSION 2>/dev/null || echo "dev")
LDFLAGS  := -s -w -X main.version=$(VERSION)
GOFILES  := $(shell find . -name '*.go' -not -path './e2e/*')

.PHONY: all build test lint clean install run

all: lint test build

build:
	go build -ldflags="$(LDFLAGS)" -o $(BINARY) .

run: build
	./$(BINARY)

test:
	go test -race -count=1 ./...

coverage:
	go test -coverprofile=coverage.out ./...
	go tool cover -html=coverage.out -o coverage.html
	@echo "Coverage report: coverage.html"

lint:
	go vet ./...
	@which golangci-lint > /dev/null 2>&1 && golangci-lint run || true

clean:
	rm -f $(BINARY) coverage.out coverage.html
	rm -rf test-results/

install: build
	install -m 755 $(BINARY) /usr/local/bin/$(BINARY)

e2e:
	cd e2e && npm install && npx playwright test

.DEFAULT_GOAL := all
