# Playwright Scraper

## Overview
This project is a web scraper built using Playwright, designed to extract job listings from a specified URL. It navigates through the pages, collects relevant data, and handles pagination to ensure comprehensive data retrieval.

## Features
- Scrapes job listings from the target website.
- Handles pagination to navigate through multiple pages of job listings.
- Configurable settings for easy adjustments to the target URL and selectors.

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
To run the scraper, execute the following command:
```
npm run scrape
```

## Running Tests
To ensure the scraper functions correctly, run the tests using:
```
npm test
```

## Configuration
Adjust the settings in `src/config.ts` to modify the target URL and selectors used for scraping.

## Contributing
Contributions are welcome! Please submit a pull request or open an issue for any enhancements or bug fixes.

## License
This project is licensed under the MIT License. See the LICENSE file for details.