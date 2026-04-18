---
id: "0020"
title: "Review Victor Mono font license and redistribution compliance"
type: chore
priority: high
status: blocked
created: 2026-04-18
updated: 2026-04-18
---

## Description

Victor Mono フォントのライセンスおよび再配布条件を調査し、catscope プロジェクトでの WOFF2 ファイルバンドルが適法であることを確認する。本 issue はユーザーによるライセンス条件の確認を待って完了とする。

## Context

catscope は Victor Mono の WOFF2 ファイル（`VictorMono-VF.woff2`, `VictorMono-Italic-VF.woff2`）を `go:embed` でバイナリに埋め込み、ブラウザに配信している。#0005 で導入されたフォントバンドル機能の一部。

---

## 調査結果（日本語）

### 基本情報

| 項目 | 内容 |
|------|------|
| フォント名 | Victor Mono |
| 作者 | Rune Bjornerås |
| ライセンス | SIL Open Font License 1.1 (OFL-1.1) |
| SPDX 識別子 | `OFL-1.1` |
| 管理団体 | SIL International |
| OSI 承認 | 2009年4月1日承認済み |

### ライセンスの主な許可事項

SIL OFL 1.1 は非常に寛容なオープンソースフォントライセンスであり、以下が**許可**されている：

1. **使用** — 個人・商用問わず自由に使用可能
2. **複製・再配布** — フォントファイルのコピーと再配布が可能
3. **バンドル配布** — ソフトウェアにフォントを同梱して配布可能（catscope の利用形態に該当）
4. **フォーマット変換** — TTF → WOFF2 等のフォーマット変換も許可される
5. **改変** — フォントの修正・派生物の作成が可能
6. **商用利用** — 商用製品へのバンドルも許可される

### ライセンスの条件（遵守すべき事項）

1. **ライセンス文の同梱が必要**
   - フォントファイルを配布する際、OFL 1.1 ライセンス全文を含める必要がある
   - 著作権表示（Copyright notice）も同梱する必要がある

2. **帰属表示（Attribution）**
   - 原作者（Rune Bjornerås）のクレジットを適切に記載する必要がある

3. **予約フォント名（Reserved Font Names）の制限**
   - フォントを改変した場合、原作者が予約した名称（"Victor Mono"）を改変版に使用してはならない
   - ※ catscope ではフォントを改変していないため、この制限には抵触しない

4. **フォント単体での販売禁止**
   - フォントファイルそのものを単独で販売することはできない
   - ※ catscope ではフォントをアプリケーションの一部として同梱しているため、この制限には抵触しない

5. **派生物も OFL 1.1 を維持**
   - フォントの改変版も OFL 1.1 で配布する必要がある（他のライセンスに変更不可）

### catscope での利用状況の適合性評価

| チェック項目 | 状態 | 備考 |
|-------------|------|------|
| WOFF2 バンドル配布 | ✅ 適合 | ソフトウェア同梱は明示的に許可 |
| go:embed によるバイナリ埋め込み | ✅ 適合 | バンドル配布の一形態 |
| 商用利用 | ✅ 適合 | OFL は商用利用を許可 |
| フォント単体販売なし | ✅ 適合 | アプリの一部として配布 |
| フォント未改変 | ✅ 適合 | 予約名制限に抵触しない |
| ライセンス文の同梱 | ⚠️ 未対応 | `THIRD_PARTY_LICENSES` ファイルが未作成（#0013 で追跡中） |

### 対応が必要な事項

**`THIRD_PARTY_LICENSES` ファイルの作成**（#0013 で追跡済み）：
- Victor Mono の著作権表示を記載
- OFL 1.1 ライセンス全文を含める
- 他のバンドルフォント（Fira Code, Ubuntu Mono）のライセンスも同様に記載

### 結論

Victor Mono の OFL 1.1 ライセンスは、catscope での利用形態（WOFF2 ファイルのバイナリ埋め込みとブラウザへの配信）を明確に許可している。ライセンス文の同梱（#0013）を完了すれば、すべての条件を満たすことになる。

**ユーザーに確認していただきたい点：**
- 上記のライセンス条件と適合性評価に問題がないか
- `THIRD_PARTY_LICENSES` ファイル（#0013）の作成で対応完了としてよいか

## Triage

- **Complexity**: low
- **Mechanical fix**: no
- **Requires user decision**: yes
- **Analysis**: The license research is complete and documented in the issue. Victor Mono's OFL 1.1 license permits catscope's usage (WOFF2 bundling, binary embedding, browser delivery). The only remaining compliance requirement is creating the `THIRD_PARTY_LICENSES` file (tracked in #0013). This issue is blocked pending user confirmation of: (1) the license analysis is satisfactory, and (2) completing #0013 resolves the compliance requirement. Once confirmed, this issue can be closed.
- **Triaged on**: 2026-04-18

## Resolution

