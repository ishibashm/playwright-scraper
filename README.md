# Playwright スクレイパー

## 概要
このプロジェクトは、Playwright と TypeScript を使用して構築されたWebスクレイパーです。指定されたURLから求人情報を抽出するように設計されています。ページをナビゲートし、関連データを収集し、ページネーションを処理し、中断されたセッションの再開をサポートします。

## 機能
- 対象ウェブサイトから求人情報（概要と詳細）をスクレイピングします。
- 複数の求人リストページをナビゲートするためのページネーションを処理します。
- **コマンドライン引数 (`--keyword`) で検索キーワードを指定できます。**
- **コマンドライン引数 (`--max-jobs`) で処理する求人の最大件数を指定できます。**
- **コマンドライン引数 (`--start-page`) でリスト取得を開始するページ番号を指定できます。**
- **以前に保存されたJSONまたはCSVファイルから詳細情報のスクレイピングを再開する機能 (`--input-file`) をサポートします。**
- **求人詳細情報をチャンク単位で処理し、各チャンクの後に続行するかユーザーに確認します。**
- 結果をJSON形式とCSV形式の両方で保存します。
- 簡単な調整のための設定が可能です（対象URLベース、デフォルトキーワード、セレクター、チャンクサイズなど）。
- 基本的なエラーハンドリングとロギングが含まれています。

## プロジェクト構成
```
playwright-scraper
├── data/                     # スクレイピングデータの保存ディレクトリ (JSON, CSV)
├── src/
│   ├── config.ts             # 設定ファイル (URL, セレクター, 上限など)
│   ├── index.ts              # メインスクリプトのエントリーポイント
│   ├── services/
│   │   ├── detailScraper.ts  # 求人詳細ページのスクレイピングロジック
│   │   └── scraper.ts        # スクレイパークラス (Playwrightブラウザ/ページ操作、リストスクレイピング)
│   ├── types/
│   │   └── types.ts          # TypeScript 型定義 (例: JobItem)
│   └── utils/
│       ├── dataSaver.ts      # JSON/CSVへのデータ保存ユーティリティ
│       ├── dateFormatter.ts  # 日付フォーマットユーティリティ
│       ├── logger.ts         # ロギングユーティリティ (Winston)
│       └── retry.ts          # (オプションのリトライロジック - 実装されている場合)
├── tests/
│   └── ...                   # ユニット/結合テスト
├── .gitignore
├── package.json              # npm 設定と依存関係
├── package-lock.json
├── tsconfig.json             # TypeScript コンパイラオプション
├── playwright.config.ts      # Playwright 設定
├── README.md                 # このファイル
└── ...                       # その他の設定ファイル (.eslintrc, .prettierrc など)
```

## インストール
1. リポジトリをクローンします:
   ```bash
   git clone https://github.com/yourusername/playwright-scraper.git
   ```
2. プロジェクトディレクトリに移動します:
   ```bash
   cd playwright-scraper
   ```
3. 依存関係をインストールします:
   ```bash
   npm install
   ```
   *(これにより、Playwright, TypeScript, ts-node, papaparse, その他の必要なパッケージがインストールされます。)*

## 使い方

`ts-node` を使用してスクリプトを実行します。様々なコマンドラインオプションを組み合わせることができます。

**注意:** `npm run scrape` 経由でスクリプトに引数を渡す場合、スクリプト引数の前に `--` を使用する必要があります (例: `npm run scrape -- --max-jobs=10`)。直接 `npx ts-node` を使用する方が簡単な場合が多いです。

1.  **基本的な実行 (デフォルトのキーワードと上限を使用):**
    設定ファイル (`config.ts`) の `maxPages` で指定されたページ数まで求人概要をスクレイピングし、その後、詳細を取得するかどうかを尋ねます。
    ```bash
    npx ts-node src/index.ts
    ```
    *(または: `npm run scrape`)*

2.  **検索キーワードの指定:**
    `--keyword` 引数を使用します。
    ```bash
    npx ts-node src/index.ts --keyword="Web開発"
    ```
    *(または: `npm run scrape -- --keyword="Web開発"`)*

3.  **開始ページの指定:**
    `--start-page` 引数を使用して、リスト取得を開始するページ番号を指定します（通常実行時のみ有効）。
    ```bash
    # 3ページ目からリスト取得を開始
    npx ts-node src/index.ts --start-page=3
    ```

4.  **求人件数の制限:**
    `--max-jobs` 引数を使用して、収集する求人概要の合計数（フェーズ1）および処理する詳細情報の数（フェーズ2）を制限します。
    ```bash
    # 最初から最大10件の求人をスクレイピング
    npx ts-node src/index.ts --max-jobs=10

    # 3ページ目から開始し、最大5件取得
    npx ts-node src/index.ts --start-page=3 --max-jobs=5
    ```

5.  **ファイルから詳細スクレイピングを再開:**
    `--input-file` 引数を使用して、以前に保存されたJSONまたはCSVファイルを指定します。スクリプトはこのファイルをロードし、概要のスクレイピング（フェーズ1）をスキップし、情報が欠落している求人の詳細のみを取得しようとします。この実行で取得する*新しい*詳細情報の数を制限するために `--max-jobs` と組み合わせることができます。
    ```bash
    # 特定のJSONファイルから再開し、最大20件の詳細情報を取得
    npx ts-node src/index.ts --input-file=data/scraped-YYYY-MM-DD_HH-MM-SS.json --max-jobs=20

    # 特定のCSVファイルから再開し、残りのすべての求人の詳細情報を取得
    npx ts-node src/index.ts --input-file=data/scraped-YYYY-MM-DD_HH-MM-SS.csv
    ```

**処理フロー:**

*   **通常モード (`--input-file` なし):**
    1.  **フェーズ1:** `--start-page` で指定されたページ（デフォルトは1）から求人概要をページごとにスクレイピングします（`config.maxPages` または `--max-jobs` の上限まで）。
    2.  詳細取得に進むかどうかを尋ねます。
    3.  **フェーズ2 ('y' の場合):** 収集された概要の詳細情報を取得します（`--max-jobs` を尊重）。`config.chunkSize` 件ごとに一時停止し、次のチャンクの取得を続けるか確認します。
    4.  **フェーズ3:** 最終的なデータ（概要＋取得した詳細）を `data` ディレクトリに新しいタイムスタンプ付きのJSONおよびCSVファイルとして保存します。
*   **再開モード (`--input-file` 指定時):**
    1.  指定された入力ファイルからデータをロードします。
    2.  詳細情報が欠落している求人を特定します。
    3.  これらの欠落項目について詳細取得に進むかどうかを尋ねます。
    4.  **フェーズ2 ('y' の場合):** 欠落項目について*のみ*詳細情報を取得します（*この実行*での `--max-jobs` を尊重）。`config.chunkSize` 件ごとに確認のために一時停止します。
    5.  **フェーズ3:** *更新された*データ（元のデータ＋新しく取得した詳細）を、新しいタイムスタンプ付きのJSONおよびCSVファイル（ファイル名に `-resumed` が付与されます）として保存します。

## テストの実行
スクレイパーが正しく機能することを確認するには、次のコマンドでテストを実行します:
```bash
npm test
```

## 設定
`src/config.ts` で設定を調整します:
- `targetUrl`: 求人検索のベースURL。
- `defaultSearchKeyword`: `--keyword` 引数が指定されない場合に使用されるキーワード。
- `jobListingSelector`, `nextPageSelector`: リストページのスクレイピング用CSSセレクター。
- `maxPages`: 通常モードでスクレイピングするリストページの最大数。
- `chunkSize`: ユーザー確認のために一時停止する前に処理する求人詳細情報の数。
- `timeout`: ページナビゲーションのタイムアウト（ミリ秒）。
- `dataDir`: スクレイピングされたデータファイル（JSON、CSV）が保存されるディレクトリ。

## コントリビューション
コントリビューションを歓迎します！機能強化やバグ修正については、プルリクエストを送信するか、Issueをオープンしてください。

## ライセンス
このプロジェクトはMITライセンスの下でライセンスされています。