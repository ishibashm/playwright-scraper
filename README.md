# Playwright Scraper

## Overview
This project is a web scraper built using Playwright, designed to extract job listings from a specified URL. It navigates through the pages, collects relevant data, and handles pagination to ensure comprehensive data retrieval.

## Features
- Scrapes job listings from the target website.
- Handles pagination to navigate through multiple pages of job listings.
- **Allows specifying search keywords via command-line arguments.**
- **Processes jobs in chunks and prompts the user to continue after each chunk.**
- Configurable settings for easy adjustments (target URL base, default keyword, selectors, chunk size, etc.).

## Project Structure
```
playwright-scraper
├── src/
│   ├── config/
│   │   └── config.ts           # 設定ファイル
│   ├── debug/
│   │   └── printSelectors.ts   # デバッグ用ユーティリティ
│   ├── services/
│   │   ├── pageNavigator.ts    # ページ遷移処理
│   │   └── scraper.ts          # スクレイピング処理
│   ├── types/
│   │   └── types.ts            # 型定義
│   ├── utils/
│   │   ├── dataSaver.ts        # データ保存処理
│   │   ├── dateFormatter.ts    # 日付フォーマット
│   │   ├── logger.ts           # ログ処理
│   │   └── retry.ts            # リトライ処理
│   ├── config.ts               # 設定エントリーポイント
│   ├── index.ts                # エントリーポイント
│   └── scraper.ts              # メインロジック（旧構成互換）
├── tests/
│   └── scraper.spec.ts         # スクレイパーテスト
├── test-results/               # テスト実行結果
├── package.json                # npm設定・依存関係
├── tsconfig.json               # TypeScript設定
├── playwright.config.ts        # Playwright設定
├── ToDo.md                     # ワークフロー・要件管理
└── README.md                   # プロジェクトドキュメント
```

## Installation
1. Clone the repository:
   ```
   git clone https://github.com/yourusername/playwright-scraper.git
   ```
2. Navigate to the project directory:
   ```
   cd playwright-scraper
   ```
3. Install the dependencies:
   ```
   npm install
   ```

## Usage

1.  **Build the project:**
    Compile the TypeScript code into JavaScript:
    ```bash
    npm run build
    ```

2.  **Run the scraper:**
    Execute the compiled code using Node.js.

    *   **Using the default search keyword (defined in `src/config.ts`):**
        ```bash
        node dist/index.js
        ```

    *   **Specifying a search keyword:**
        Use the `--keyword` argument. Replace `"Your Keyword"` with the desired search term.
        ```bash
        node dist/index.js --keyword="Your Keyword"
        ```

    The scraper will process jobs in chunks (size defined in `src/config.ts`). After each chunk, it will ask `Continue to next chunk? (y/n):`. Enter `y` to continue or `n` to stop and save the data collected so far.

## Running Tests
To ensure the scraper functions correctly, run the tests using:
```
npm test
```

## Configuration
Adjust the settings in `src/config.ts`:
- `targetUrl`: The base URL for the job search (without keywords or page numbers).
- `defaultSearchKeyword`: The keyword used when no `--keyword` argument is provided.
- `jobListingSelector`, `nextPageSelector`: CSS selectors for scraping (may need adjustment based on website structure).
- `maxPages`: The maximum number of pages to scrape.
- `chunkSize`: The number of jobs to process before pausing and asking the user to continue.
- `timeout`: Timeout for page navigation in milliseconds.

## Contributing
Contributions are welcome! Please submit a pull request or open an issue for any enhancements or bug fixes.

## License
This project is licensed under the MIT License. See the LICENSE file for details.