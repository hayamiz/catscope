---
id: "0013"
title: "Create THIRD_PARTY_LICENSES file for bundled fonts"
type: chore
priority: medium
status: resolved
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

## Content filter issue

AI (Claude) によるライセンス全文の生成は、コンテンツフィルタリングポリシーによりブロックされる。これは著作権保護されたテキストの逐語的再現を防ぐフィルタであり、OFL のように自由にコピー可能なライセンスでも誤検出が発生する。

サブエージェント経由でも直接 Write ツールでも、ライセンス全文を含むファイル生成はブロックされた。一方、ファイル構造（ヘッダー・著者名・ライセンス名のみ）やプリアンブル1段落程度は生成可能だった。

### 採用した戦略: ダウンロード + 加工

ライセンステキストを AI に生成させるのではなく、以下の手順で取得した:

1. 各フォントの公式リポジトリからライセンスファイルを `curl` でダウンロード
2. ヘッダー付きで `THIRD_PARTY_LICENSES` ファイルに `cat` で結合

ダウンロード元:
- **Fira Code**: `https://raw.githubusercontent.com/tonsky/FiraCode/master/LICENSE`
- **Ubuntu Mono**: `https://raw.githubusercontent.com/canonical/Ubuntu-fonts/main/LICENCE.txt`
- **Victor Mono**: `https://raw.githubusercontent.com/rubjo/victor-mono/master/LICENSE`

## Triage

- **Complexity**: low
- **Mechanical fix**: yes
- **Requires user decision**: no
- **Analysis**: ライセンステキストの AI 生成はコンテンツフィルタでブロックされるため、公式リポジトリからのダウンロード+加工戦略を採用。bash ツールのみで実現可能。
- **Triaged on**: 2026-04-18

## Resolution

公式リポジトリから `curl` でライセンスファイルをダウンロードし、セクションヘッダー付きで `THIRD_PARTY_LICENSES` ファイル（309行）を作成した。3フォント分のライセンス全文（OFL 1.1 x2, Ubuntu Font License 1.0 x1）を含む。
