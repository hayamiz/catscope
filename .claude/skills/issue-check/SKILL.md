---
name: issue-check
description: List all currently open issues
---

# Issue Check

Display a summary of all currently open issues in `doc/issues/`.

## Instructions

1. **Collect open issues**: List all `*.md` files in `doc/issues/` (excluding `CLAUDE.md` and the `resolved/` subdirectory). Read each file's frontmatter.

2. **Filter**: Include only issues with `status: open`, `status: in-progress`, or `status: blocked`.

3. **Display**: Present the issues in a table sorted by priority (critical > high > medium > low), then by issue number:

   | Issue | Title | Type | Priority | Status | Created |
   |-------|-------|------|----------|--------|---------|
   | #NNNN | ...   | ...  | ...      | ...    | ...     |

4. **Summary line**: After the table, show:
   - Total count of open issues
   - Breakdown by status (e.g., "3 open, 1 in-progress, 1 blocked")
   - Breakdown by priority (e.g., "1 critical, 2 high, 1 medium, 1 low")

5. **If no open issues**: Report "No open issues." to the user.

## Notes

- This skill is read-only — it does not modify any issue files.
- If any issue files have malformed frontmatter, report them as warnings but do not fail.
