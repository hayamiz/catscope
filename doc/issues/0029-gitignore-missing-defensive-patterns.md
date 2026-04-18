---
id: "0029"
title: ".gitignore missing defensive patterns for sensitive files"
type: chore
priority: medium
status: open
created: 2026-04-18
updated: 2026-04-18
---

## Description

The current `.gitignore` does not include defense-in-depth patterns for common sensitive file types:

- `.env*` — Environment variable files
- `*.pem`, `*.key` — TLS/SSH private keys
- `credentials.json`, `secrets.json` — Credential files

While no such files currently exist in the repository, adding these patterns prevents accidental commits in the future.

## Context

Discovered during gardener audit on 2026-04-18. This is a preventive measure, not a response to an existing leak.
