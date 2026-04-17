# Issue Management Rules

Issues are tracked as individual Markdown files in `doc/issues/`. This document defines the authoritative rules for creating, updating, and managing issues.

## File Naming

- Format: `NNNN-<subject>.md` (e.g., `0001-fix-websocket-reconnect.md`)
- `NNNN` is a zero-padded 4-digit sequential number.
- `<subject>` is a short kebab-case summary in English.
- To determine the next number, find the highest existing number across both `doc/issues/` and `doc/issues/resolved/`, then increment by 1. If no issues exist, start at `0001`.

## File Format

Every issue file MUST use the following YAML frontmatter + body structure:

```markdown
---
id: "NNNN"
title: "<concise title in English>"
type: bug | feature | enhancement | refactor | docs | test | chore
priority: critical | high | medium | low
status: open | in-progress | blocked | resolved | wontfix
created: YYYY-MM-DD
updated: YYYY-MM-DD
---

## Description

<Detailed description of the issue.>

## Context

<Why this matters, how it was discovered, related files/areas.>

## Resolution

<Filled in when resolved. What was done, which commits/PRs addressed it.>
```

### Field Definitions

#### type
- **bug** — Something is broken or behaves incorrectly.
- **feature** — New functionality that does not exist yet.
- **enhancement** — Improvement to existing functionality.
- **refactor** — Code restructuring without behavior change.
- **docs** — Documentation updates.
- **test** — Adding or improving tests.
- **chore** — Build, CI, tooling, dependency updates, etc.

#### priority
- **critical** — Blocks development or causes data loss / security vulnerability. Fix immediately.
- **high** — Significant impact on usability or correctness. Fix soon.
- **medium** — Notable but not urgent. Fix in normal course of work.
- **low** — Minor or cosmetic. Fix when convenient.

#### status
- **open** — Newly created, not yet started.
- **in-progress** — Actively being worked on.
- **blocked** — Cannot proceed; waiting on user decision, external dependency, or design clarification.
- **resolved** — Fix completed and verified. File moves to `doc/issues/resolved/`.
- **wontfix** — Decided not to address. File moves to `doc/issues/resolved/`.

## Lifecycle

1. **Creation** — A new issue file is created in `doc/issues/` with status `open`.
2. **Triage** — The issue is analyzed for complexity, difficulty, and whether it can be fixed mechanically or requires user design decisions. Triage results are appended as a `## Triage` section.
3. **Work** — Status changes to `in-progress` and `updated` date is set.
4. **Resolution** — Status changes to `resolved` or `wontfix`, the `## Resolution` section is filled in, `updated` date is set, and the file is moved to `doc/issues/resolved/`.

## Triage Section Format

When an issue is triaged, append the following section:

```markdown
## Triage

- **Complexity**: low | medium | high
- **Mechanical fix**: yes | no
- **Requires user decision**: yes | no
- **Analysis**: <Brief explanation of what needs to be done and why it is or isn't mechanical.>
- **Triaged on**: YYYY-MM-DD
```

- **Mechanical fix: yes** means the fix can be implemented without ambiguity — the correct behavior is clear from the spec, tests, or conventions.
- **Mechanical fix: no** means the fix requires design decisions, trade-offs, or clarification from the user.

## Moving Resolved Issues

When an issue reaches status `resolved` or `wontfix`:

1. Update the `status` and `updated` fields in the frontmatter.
2. Fill in the `## Resolution` section.
3. Move the file: `mv doc/issues/NNNN-subject.md doc/issues/resolved/`

## General Rules

- All issue content (title, description, comments) MUST be written in English.
- Always update the `updated` date field when modifying an issue.
- Do not delete issue files — move resolved/wontfix issues to `resolved/` for historical reference.
- When referencing issues in commit messages or other docs, use the format `#NNNN` (e.g., `#0001`).
