---
name: issue-fix
description: Fix all mechanically fixable issues identified by issue-triage
argument-hint: "[issue-number]"
---

# Issue Fix

Implement fixes for all open issues that were triaged as mechanically fixable (no user decision needed).

## Instructions

1. **Read the rules**: Read `doc/issues/CLAUDE.md` to understand the issue lifecycle and resolution process.

2. **Collect candidates**: List all `*.md` files in `doc/issues/` (excluding `CLAUDE.md` and the `resolved/` subdirectory). Read each file and filter to those that meet ALL of these criteria:
   - `status: open` or `status: in-progress`
   - Has a `## Triage` section
   - Triage indicates `Mechanical fix: yes` and `Requires user decision: no`

3. **If no triage data exists**: If open issues exist but none have been triaged, inform the user to run `/issue-triage` first. Do NOT attempt to fix un-triaged issues.

4. **Fix issues in priority order**: Sort candidates by priority (critical > high > medium > low), then process each issue.

   **IMPORTANT — use subagents to conserve context**: Delegate the implementation of each individual issue to a subagent via the Agent tool. The parent (you) is responsible for orchestration only: reading issues, dispatching subagents, collecting results, and presenting the final summary. This prevents the main conversation context from being consumed by the details of each fix.

   **Subagent dispatch pattern**:
   - Launch one Agent per issue. If issues are independent (no shared file conflicts), run multiple subagents in parallel.
   - The subagent prompt MUST include:
     1. The full text of the issue file (copy it into the prompt — the subagent has no conversation history).
     2. The project conventions: "Read CLAUDE.md for project conventions before making changes."
     3. The exact steps to perform (steps a–g below).
     4. Clear success criteria: "When done, report: which files were changed, which tests were added, and whether go vet / go test pass."
   - If two issues touch the same files, run them sequentially (not in parallel) to avoid merge conflicts.
   - After each subagent completes, verify its work: check `git diff` or read the changed files to confirm the changes are correct before moving to the next issue.

   **Steps each subagent must perform (include these in the subagent prompt)**:

   a. **Update status**: Change the issue's status to `in-progress` and update the `updated` date.

   b. **Implement the fix**: Based on the issue description and triage analysis, make the necessary code changes. Follow all project conventions in `CLAUDE.md` (code style, testing requirements, etc.).

   c. **Add or update tests**: Analyze the changes you made and add tests that cover the new or modified behavior. This is a REQUIRED step — do not skip it.

      **Analysis process**:
      1. Identify every code path that was added or changed (new functions, new branches, new endpoints, new UI interactions).
      2. For each code path, determine the appropriate test type:
         - **Go unit tests** (`*_test.go`): for new/changed handlers, utility functions, error conditions, security validations (path traversal, input sanitization). Follow the existing `httptest` pattern in `server_test.go`.
         - **Playwright e2e tests** (`e2e/tests/*.spec.ts`): for new/changed UI interactions (buttons, drag/resize, toggles, dropdowns), visual state changes, and user-facing workflows. Follow the existing patterns in `e2e/tests/`.
         - **Shell tests** or integration tests: for changes to shell scripts (`scripts/`).
      3. Prioritize test cases by risk:
         - **Must test**: Security-sensitive code (path traversal, XSS sanitization, auth), error handling (HTTP status codes, edge cases), core functionality (new endpoints, new API contracts).
         - **Should test**: UI interactions (new buttons, toggles, drag behavior), state management (localStorage, toggle persistence), boundary conditions (file size limits, empty inputs).
         - **Nice to have**: Visual/cosmetic changes (CSS styling, icon appearance), trivial getters/setters.
      4. Write the tests. Use table-driven tests for Go. Use `test.describe` blocks for Playwright.
      5. Run the tests to confirm they pass.

      **Minimum test requirements per change type**:
      | Change type | Required tests |
      |---|---|
      | New HTTP handler/endpoint | Unit test: success path, 403 (path traversal), 404 (not found), error conditions |
      | New CLI flag | Unit test: flag parsing, behavior toggle |
      | New frontend button/interaction | E2e test: element exists, click produces expected result |
      | New frontend toggle/state | E2e test: toggle changes state, state reflected in UI |
      | Security-sensitive change | Unit test: ALL malicious input variants (path traversal, XSS payloads, oversized input) |
      | Bug fix | Regression test: reproduces the original bug scenario, verifies it no longer occurs |

   d. **Verify the fix**:
      - Run `go vet ./...` to check for issues.
      - Run `go test ./...` to ensure all tests pass (including the new ones).
      - If Playwright tests were added, run `cd e2e && npx playwright test` to verify.

   e. **Update specification**: If the fix changes or adds user-visible behavior (new endpoints, changed defaults, new CLI flags, altered response formats, etc.), update `doc/SPEC.md` to reflect the new behavior. This keeps the authoritative spec in sync with the implementation. Skip this step for purely internal changes (refactors, test fixes, comment updates) that don't affect documented behavior.

   f. **Resolve the issue**:
      - Update the issue's `status` to `resolved` and set the `updated` date.
      - Fill in the `## Resolution` section describing what was changed, including which tests were added.
      - Move the file to `doc/issues/resolved/`.

   g. **If a fix fails or turns out to need user input**: Do NOT force a fix. Instead, update the triage section to note that the issue is more complex than initially assessed, set `Mechanical fix: no` and `Requires user decision: yes`, and leave the status as `open`. Move on to the next issue.

5. **Report**: After processing all candidates, present a summary:

   ### Fixed
   | Issue | Title | What was done |
   |-------|-------|---------------|
   | #NNNN | ...   | ...           |

   ### Could not fix (needs user decision)
   | Issue | Title | Reason |
   |-------|-------|--------|
   | #NNNN | ...   | ...    |

   ### Skipped (already requires user decision)
   | Issue | Title | Decision needed |
   |-------|-------|-----------------|
   | #NNNN | ...   | ...             |

## Notes

- Do NOT fix issues marked as `Requires user decision: yes`. List them in the "Skipped" section.
- If `go test` or `go vet` fails after a fix, revert the changes for that issue and report it as "Could not fix".
- Each fix should be a focused, minimal change — do not refactor surrounding code or add unrelated improvements.
