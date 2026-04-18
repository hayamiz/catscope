---
name: issue-triage
description: Triage all open issues — analyze complexity, feasibility, and whether user decisions are needed
argument-hint: "[issue-number]"
---

# Issue Triage

Analyze all open issues in `doc/issues/` and classify each by complexity, whether it can be fixed mechanically, and whether it requires user design decisions.

## Instructions

1. **Read the rules**: Read `doc/issues/CLAUDE.md` to understand the triage section format.

2. **Collect open issues**: List all `*.md` files in `doc/issues/` (excluding `CLAUDE.md` and the `resolved/` subdirectory). Read each file and filter to those with `status: open` or `status: in-progress`.

3. **Triage each issue using subagents**: For each open issue, launch an Agent (subagent) to analyze it. The subagent should:
   - Read the issue file.
   - Read the project's `SPEC.md` and relevant source files to understand the context.
   - Assess:
     - **Complexity**: low / medium / high — based on the number of files affected, the scope of changes, and potential for regressions.
     - **Mechanical fix**: yes / no — Can this be fixed unambiguously from the spec, existing tests, and conventions? Or does it require design choices?
     - **Requires user decision**: yes / no — Does the fix need input from the user on behavior, UX, architecture, or trade-offs?
   - **If mechanical fix is NO**: Before concluding the triage, the subagent must:
     1. Research the relevant source code, SPEC, and dependencies in depth.
     2. Draft a concrete implementation plan: what files to change, what approach to take, what alternatives exist, and what trade-offs each alternative has.
     3. Update the issue file's `## Description` or add a new `## Implementation Notes` section with the concrete plan, open questions, and specific decision points for the user.
     4. Only then classify `requires user decision: yes/no` — some non-mechanical issues may still not need user input once the plan is fleshed out.
   - Return a triage analysis including the above fields and a brief explanation.

   Run subagents in parallel where possible for efficiency.

4. **Update issue files**: For each triaged issue, append or update the `## Triage` section in the issue file with the results, following the format in `doc/issues/CLAUDE.md`. Update the `updated` date in the frontmatter.

5. **Present summary**: After all issues are triaged, present a summary to the user organized into two groups:

   ### Mechanically fixable (no user decision needed)
   | Issue | Title | Priority | Complexity | Summary |
   |-------|-------|----------|------------|---------|
   | #NNNN | ...   | ...      | ...        | ...     |

   ### Requires user decision
   | Issue | Title | Priority | Complexity | Decision needed |
   |-------|-------|----------|------------|-----------------|
   | #NNNN | ...   | ...      | ...        | ...             |

## Notes

- If an issue already has a `## Triage` section, re-analyze it (the codebase may have changed since the last triage).
- If there are no open issues, report that to the user.
