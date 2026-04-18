---
id: "0013"
title: "Create THIRD_PARTY_LICENSES file for bundled fonts"
type: chore
priority: medium
status: open
created: 2026-04-18
updated: 2026-04-18
---

## Description

Create a `THIRD_PARTY_LICENSES` file in the repository root documenting the licenses for bundled fonts:

1. **Fira Code** by Nikita Prokopov - SIL Open Font License 1.1
2. **Ubuntu Mono** by Dalton Maag Ltd - Ubuntu Font License 1.0
3. **Victor Mono** by Rune Bjornerås - SIL Open Font License 1.1

The file should include the full license text for each font, separated by clear section headers.

## Context

This was identified as part of #0005 (Bundle coding webfont). The font files have been bundled but the license file could not be generated due to content filtering policy blocking the license text output. This needs to be created manually or via a different method.

## Triage

- **Complexity**: low
- **Mechanical fix**: yes
- **Requires user decision**: no
- **Analysis**: Copy-paste the license texts from each font's official repository into a single file. Straightforward but requires manual intervention due to content filter limitations.
- **Triaged on**: 2026-04-18

## Resolution

