-- Schema for a file access audit log

CREATE TABLE users (
    id          SERIAL PRIMARY KEY,
    username    VARCHAR(64) NOT NULL UNIQUE,
    email       VARCHAR(128) NOT NULL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE files (
    id          SERIAL PRIMARY KEY,
    path        VARCHAR(512) NOT NULL UNIQUE,
    size_bytes  BIGINT NOT NULL DEFAULT 0,
    mime_type   VARCHAR(128),
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE access_log (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER REFERENCES users(id),
    file_id     INTEGER REFERENCES files(id),
    action      VARCHAR(16) NOT NULL CHECK (action IN ('view', 'download', 'delete')),
    ip_address  INET,
    accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_access_log_user ON access_log(user_id);
CREATE INDEX idx_access_log_file ON access_log(file_id);
CREATE INDEX idx_access_log_time ON access_log(accessed_at DESC);

-- Seed data
INSERT INTO users (username, email) VALUES
    ('alice', 'alice@example.com'),
    ('bob', 'bob@example.com'),
    ('carol', 'carol@example.com');

INSERT INTO files (path, size_bytes, mime_type) VALUES
    ('src/main.go', 2048, 'text/plain'),
    ('README.md', 512, 'text/markdown'),
    ('logo.svg', 8192, 'image/svg+xml');

INSERT INTO access_log (user_id, file_id, action, ip_address) VALUES
    (1, 1, 'view', '192.168.1.10'),
    (2, 2, 'download', '192.168.1.11'),
    (1, 3, 'view', '192.168.1.10'),
    (3, 1, 'view', '10.0.0.5');

-- Query: most accessed files in the last 24 hours
SELECT f.path, COUNT(*) AS views
FROM access_log a
JOIN files f ON f.id = a.file_id
WHERE a.accessed_at > CURRENT_TIMESTAMP - INTERVAL '24 hours'
GROUP BY f.path
ORDER BY views DESC
LIMIT 10;
