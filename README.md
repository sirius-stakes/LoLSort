# RIFT EFFECTS

League of Legends のチャンピオンスキルを、**付与するバフ・デバフ（CC）から横断検索できる**ファンメイド Web アプリです。

Data Dragon（ja_JP）の日本語スキル名・説明・画像と、Meraki Analytics の構造化された CC / 効果時間データを組み合わせて、173 チャンピオン / 865 スキルを収録しています（Patch 16.22.1）。

---

## 主な機能

### 1. 効果タグによるフィルタリング
- **ハードCC**: スタン / スネア / ノックアップ / サプレッション / チャーム / タウント / フィアー / 睡眠 / ポリモーフ
- **ソフトCC**: スロー / サイレンス / ブラインド / グラウンド
- **バフ**: シールド / 移動速度増加 / 攻撃速度増加 / 回復 / 無敵・アンストッパブル
- **デバフ**: 防御力低下 / 重傷
- **ダメージ種別**: 物理 / 魔法 / 確定

複数タグの **AND（すべて） / OR（いずれか）** 検索に対応。各タグには該当スキル数を表示します。

### 2. リアルタイム検索
チャンピオン名・タイトル・スキル名を対象に、入力と同時に絞り込みます。

### 3. スキルキー / ソート
- Passive / Q / W / E / R のスキル枠フィルター
- チャンピオン名順、効果時間（長い / 短い）、スキルキー順、タグ数順

### 4. スキルカード
- チャンピオンアイコン・名前・タイトル・レーン
- スキルアイコン・キー・名前
- **効果時間バッジ**（例: `⏱ 1.25〜1.75秒 スタン`）
- クールダウン
- 日本語のスキル説明（該当キーワードをハイライト）
- 効果タグのフッター

### 5. レスポンシブ
- デスクトップ: 300px の Sticky サイドバー + 2〜3 カラムグリッド
- モバイル / タブレット: 上部検索バー + フィルタードロワー（1 カラム）

---

## 技術スタック

| 領域 | 採用 |
| --- | --- |
| フレームワーク | React 19 + TypeScript |
| ビルド | Vite 8 |
| スタイリング | Tailwind CSS v4（`@tailwindcss/vite`） |
| 状態管理 | `useState` / `useMemo` によるクライアントサイドフィルタリング |
| データ | Data Dragon 16.22.1 (ja_JP) + Meraki Analytics |

Hextech 風のダークテーマ（`#010A13` / `#091428` / ゴールド `#C89B3C` / オフホワイト `#F0E6D2`）で構成しています。

---

## セットアップ

```bash
npm install
npm run dev      # http://localhost:5173
```

本番ビルド:

```bash
npm run build
npm run preview
```

### npm scripts

| コマンド | 内容 |
| --- | --- |
| `npm run dev` | 開発サーバー起動 |
| `npm run build` | 型チェック + 本番ビルド |
| `npm run preview` | ビルド成果物のプレビュー |
| `npm run fetch:data` | Data Dragon / Meraki から `src/data/champions.json` を再生成（全 173 チャンピオン） |
| `npm run data` | 上記と同じ（互換用エイリアス） |
| `npm run data:legacy` | 旧 `scripts/build-data.mjs` を実行（非推奨） |

> Node.js 24 以上を推奨します（`fetch:data` は TypeScript をネイティブの型ストリッピングで直接実行します）。

---

## データ生成の仕組み

`npm run fetch:data` は `scripts/fetchChampionData.ts` を実行します。

1. **Data Dragon** から最新バージョンと `ja_JP` のチャンピオン詳細を取得
   - チャンピオン名 / タイトル / クラス / 画像
   - パッシブ・スキル名 / 説明 / 画像
2. **Meraki Analytics** の `en-US` 構造化データを取得
   - スキル効果の英語詳細
   - CC 種別、レベル別の効果時間、クールダウン
3. 英語効果文とレベル項目からタグ・効果時間を自動分類
4. 誤判定しやすい代表スキルは `CURATED` で手動補正
5. `src/data/champions.json` に出力

### 分類の考え方

- タグは Meraki の効果説明とレベル項目名から抽出（`notes` / `blurb` は文脈外の語を含むため除外）
- 「スキル名そのものに CC 名が含まれる」ケースを除外（例: Kha'Zix "Taste Their Fear"）
- 「CC 無効」「～できない」など、付与しない文脈を除外
- 効果時間は以下を優先
  1. Meraki のレベル別 `Duration` 項目（`Disable Duration` など単位なしの秒数にも対応）
  2. 説明文の `for 1.5 seconds` / `for 1 : 3.5 seconds` / `for 1.25 / 1.5 / 1.75 seconds`
  3. 手動補正（`CURATED_DURATIONS`）
- 複数の効果がある場合は CC → バフの優先順で代表値を 1 つ表示
- 説明文は Data Dragon の日本語テキストを使用

自動分類のため、一部スキルでは実際の挙動とタグ・効果時間が完全一致しない場合があります。発見した場合は `scripts/fetchChampionData.ts` の `CURATED_REMOVE` / `CURATED_DURATIONS` に追記して再生成してください。

---

## ディレクトリ構成

```
.
├── index.html
├── public/
│   └── hex.svg
├── scripts/
│   └── fetchChampionData.ts    # 全チャンピオンデータ取得・分類・JSON 生成
├── src/
│   ├── App.tsx                 # フィルタ状態 / レイアウト / ページネーション
│   ├── main.tsx
│   ├── index.css               # Tailwind テーマ・Hextech 背景
│   ├── types.ts
│   ├── components/
│   │   ├── Header.tsx
│   │   ├── FilterPanel.tsx     # 検索・タグ・AND/OR・スキルキー・リセット
│   │   ├── SkillCard.tsx       # スキルカード
│   │   ├── TagBadge.tsx
│   │   └── Icons.tsx
│   ├── data/
│   │   ├── champions.json      # 生成済みデータ
│   │   └── tags.ts             # タグ定義・カテゴリ・色・ソート
│   └── lib/
│       ├── format.ts           # 画像 URL / 時間フォーマット
│       └── highlight.tsx       # キーワードハイライト
├── package.json
├── vite.config.ts
└── tsconfig*.json
```

---

## 実装メモ

- 画像は Data Dragon の CDN URL を参照（バージョンは `champions.json` の `meta.version` に固定）
- 初期表示は 48 件。`さらに表示` で追加読み込み
- フィルター変更時は表示件数をリセット
- モバイルドロワーは `Escape` で閉じ、背景スクロールをロック
- `prefers-reduced-motion` を尊重
- タグ未選択時は全 865 スキルを表示
- データ JSON を同梱しているため、オフラインでも UI は動作（画像は CDN 参照）

### 既知の制約

- バンドルサイズは約 600 kB（gzip 約 157 kB）。大半は 865 スキル分の日本語説明を含む JSON です。必要に応じて動的 import で分割できます。
- 効果時間は「スキルが持続する時間」ではなく、代表的な CC / バフの付与時間を表示します。
- パッシブや形態変化など、説明文が複数効果を持つスキルは代表値のみ表示します。

---

## 免責事項

RIFT EFFECTS は Riot Games 非公式のファンメイドツールです。League of Legends および関連する画像・テキストは Riot Games, Inc. の著作物です。

データ出典:

- [Data Dragon](https://developer.riotgames.com/docs/lol#data-dragon)（Riot Games）
- [Meraki Analytics](https://merakianalytics.com/)（コミュニティデータ）
