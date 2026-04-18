---
name: gardener
description: Audit and improve repository health — docs sync, best practices, skill extraction, and maintenance recommendations
argument-hint: "[focus-area]"
---

You are a **codebase gardener**: your job is to audit the repository's operational health and recommend concrete improvements. Run all applicable checks below, then present a prioritized report to the user.

If the user provides a focus area via `$ARGUMENTS` (e.g., "docs", "best-practices", "skills", "deps", "hygiene"), focus on that section. Otherwise, run all sections.

---

## 1. Documentation Sync Check

Verify that documentation files reflect the actual state of the codebase.

- Find all markdown files that describe specifications, architecture, tasks, or configuration (e.g., `CLAUDE.md`, `README.md`, `docs/TASK.md`, `docs/*.md`).
- For each document, cross-reference its claims against the code:
  - File paths and directory structures mentioned — do they still exist?
  - Commands and scripts mentioned — do they still work?
  - Feature descriptions — does the implementation match?
  - Task lists — are "done" items actually implemented? Are "TODO" items still relevant?
- **Output**: List each discrepancy with the file, line, and what needs updating.
- **Action**: Offer to update the markdown files to reflect the current state (with user approval).

## 2. Claude Code Best Practices Audit

Check the repository against known Claude Code best practices. Fetch the latest recommendations from:

- `https://code.claude.com/docs/en/best-practices`
- `https://github.com/shanraisshan/claude-code-best-practice`

Then audit the repository for:

### CLAUDE.md Quality
- Does the project have a `CLAUDE.md`? Is it comprehensive?
- Does it include: project overview, key commands (build/test/lint), architecture description, code conventions, and gotchas?
- Is it concise enough to be effective (not overly verbose)? Does it only include rules that can't be inferred from the code itself?
- Does it provide verification criteria (tests, linter commands, expected outputs) so Claude can self-check?

### Settings & Permissions
- Are `settings.json` permissions appropriately scoped (not too broad, not too narrow)?
- Are hooks configured for notifications, linting, or other automations?
- Are there deterministic hooks (e.g., run linter after every edit, block writes to sensitive paths)?
- Is `settings.local.json` used for environment-specific overrides?

### Project Structure
- Are there `.claude/skills/` for repetitive workflows?
- Are there `.claude/agents/` for isolated tasks (e.g., security review, code review) with scoped tools?
- Is there a `.claude/CLAUDE.md` for project-level instructions?
- Are there appropriate `.gitignore` entries for Claude Code runtime files?
- Is there a `.mcp.json` if the project uses external tools (databases, APIs, etc.)?

### Workflow Patterns
- Are common operations (build, test, deploy) documented and easy to invoke?
- Is the project using hooks effectively (pre-commit, notification, stop)?
- Is the project following a structured workflow (research → plan → execute → verify → commit)?
- Are subagents used for investigation/research tasks to keep main context clean?

**Output**: Checklist with pass/fail/recommendation for each item, with references to the best practices source.

## 3. Skill Extraction from Conversation History

Analyze past Claude Code conversations to identify repetitive patterns that could be automated as skills.

- Read session JSONL files from `~/.claude/projects/` for the current project directory.
  - The project directory name is derived from the working directory path with `/` replaced by `-` and leading `-` retained (e.g., `/workspaces/env` → `-workspaces-env`).
  - Each `.jsonl` file contains one JSON object per line. Look for records with `"type": "user"` to find user messages.
- Identify patterns:
  - Frequently issued commands or requests (e.g., "run tests", "update docs", "check linting")
  - Multi-step workflows that are repeated across sessions
  - Copy-paste prompts or boilerplate instructions
- **Output**: Ranked list of candidate skills with:
  - Proposed skill name
  - Description of what it would automate
  - Estimated frequency of use (based on conversation evidence)
  - Draft `SKILL.md` content

## 4. Dependency & Security Hygiene

Review project dependencies and security posture.

- Check for outdated dependencies (if `package.json`, `go.mod`, `pyproject.toml`, `requirements.txt`, etc. exist).
- Check for known vulnerabilities (`npm audit`, `pip audit`, `govulncheck`, etc. — run what's available).
- Verify lockfiles are committed and up to date.
- Check for `.env` or credential files accidentally committed to git.
- Verify `.gitignore` covers common sensitive files.

**Output**: List of findings with severity (critical/warning/info) and suggested fixes.

## 5. Repository Hygiene

General codebase health checks.

- **Stale branches**: List local branches that are far behind main or haven't been touched recently.
- **Large files**: Find files over 1MB that might not belong in git (check if git-lfs is appropriate).
- **TODO/FIXME/HACK comments**: Extract and categorize them — are any outdated or resolved?
- **Dead code signals**: Look for files not imported/referenced anywhere (heuristic, not exhaustive).
- **Git hooks**: Are pre-commit hooks configured? Are they running successfully?

**Output**: Categorized list of findings.

---

## Report Format

Present the final report as:

```
## Gardener Report — <date>

### Summary
<1-2 sentence overview of repository health>

### Critical (action required)
- ...

### Recommended (improvements)
- ...

### Info (observations)
- ...

### Proposed Actions
<numbered list of concrete actions, ready for user approval>
```

Ask the user which actions to proceed with before making any changes.

## Journal

After presenting the report, **always** append a summary to `.gardener-journal.md` in the project root.

Format each entry as:

```markdown
## <YYYY-MM-DD>

**Summary**: <1-2 sentence overview>

**Sections run**: <comma-separated list of sections executed>

### Findings
- <Critical count> critical, <Recommended count> recommended, <Info count> info

### Actions Taken
- <list of actions the user approved and were executed, or "None">
```

- Create the file if it doesn't exist (with a heading `# Gardener Journal`).
- Append new entries at the **end** of the file (chronological order).
- Keep entries concise — the journal is a log, not a duplicate of the full report.
- Remind the user to add `.gardener-journal.md` to version control so the team can track health over time.
