---
id: "0030"
title: "Add deny rules in .claude/settings.json for sensitive files"
type: chore
priority: high
status: open
created: 2026-04-18
updated: 2026-04-18
---

## Description

`.claude/settings.json` currently has an empty `allow` list and no `deny` rules. Add explicit deny rules to prevent Claude Code from reading or writing sensitive files such as:

- `.env*` — Environment variable files with secrets
- `*.pem`, `*.key` — Private keys
- `credentials.json`, `secrets.json` — Credential stores
- `**/id_rsa`, `**/id_ed25519` — SSH private keys
- `**/.aws/credentials` — AWS credentials

This provides a safety net against accidental exposure of secrets through Claude Code operations, even if such files are added to the project directory in the future.

## Context

Identified during gardener audit on 2026-04-18. The current `.claude/settings.json` has no deny rules configured. Adding deny rules is a defense-in-depth measure that complements `.gitignore` protections.
