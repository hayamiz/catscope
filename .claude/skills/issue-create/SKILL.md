---
name: issue-create
description: Create a new issue in doc/issues/
argument-hint: "<title or description>"
---

# Issue Create

Create a new issue file in `doc/issues/` following the rules in `doc/issues/CLAUDE.md`.

## Instructions

1. **Read the rules**: Read `doc/issues/CLAUDE.md` to understand the file format and naming conventions.

2. **Determine the next issue number**:
   - List all files in `doc/issues/` and `doc/issues/resolved/` matching the `NNNN-*.md` pattern.
   - Extract the highest number and increment by 1. If no issues exist, start at `0001`.

3. **Gather issue details from the user's input** (the arguments passed to this skill):
   - If the user provided a description, use it.
   - If the user only provided a brief phrase, use it as the title and ask for more details if needed, or infer a reasonable description from context.

4. **Determine metadata**:
   - `type`: Infer from the description (bug, feature, enhancement, refactor, docs, test, chore). If unclear, ask the user.
   - `priority`: Infer from the description and context. Default to `medium` if unclear.
   - `status`: Always `open` for new issues.
   - `created` and `updated`: Set to today's date.

5. **Create the file**:
   - Filename: `NNNN-<kebab-case-subject>.md` in `doc/issues/`.
   - Use the exact frontmatter + body template from `doc/issues/CLAUDE.md`.
   - The `<subject>` in the filename should be a short (2-5 words) kebab-case summary.

6. **Report**: Show the user the created issue file path and a summary of the issue.

## Example

User input: `/issue-create WebSocket disconnects on large files`

Creates: `doc/issues/0001-websocket-disconnect-large-files.md` with appropriate frontmatter and description.
