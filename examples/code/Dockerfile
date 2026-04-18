# Stage 1: Build the Go binary
FROM golang:1.22-alpine AS builder

RUN apk add --no-cache git ca-certificates

WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download

COPY . .
ARG VERSION=dev
RUN CGO_ENABLED=0 GOOS=linux go build \
    -ldflags="-s -w -X main.version=${VERSION}" \
    -o /catscope .

# Stage 2: Minimal runtime image
FROM alpine:3.20

RUN apk add --no-cache tini ca-certificates \
    && addgroup -S app \
    && adduser -S -G app app

COPY --from=builder /catscope /usr/local/bin/catscope

USER app
WORKDIR /data

EXPOSE 4567

HEALTHCHECK --interval=30s --timeout=3s \
    CMD wget -qO- http://localhost:4567/healthz || exit 1

ENTRYPOINT ["tini", "--"]
CMD ["catscope"]
