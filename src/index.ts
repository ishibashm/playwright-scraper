import * as readline from 'readline';
import { stdin as input, stdout as output } from 'process';
import { Scraper } from './services/scraper';
import { saveDataAsJson } from './utils/dataSaver';
import { JobItem } from './types/types';
import { config } from './config';
import logger from './utils/logger';

async function main() {
  const scraper = new Scraper();
  const rl = readline.createInterface({ input, output }); // readlineインターフェースを作成

  // 質問して回答を待つ非同期関数
  const askQuestion = (query: string): Promise<string> => {
    return new Promise(resolve => rl.question(query, resolve));
  };

  try {
    await scraper.init();
    let allJobs: JobItem[] = [];
    let page = 1;
    let hasMore = true;
    let processedJobsCount = 0; // チャンク処理用のカウンター

    // コマンドライン引数からキーワードを取得（なければデフォルトを使用）
    const keywordArg = process.argv.find(arg => arg.startsWith('--keyword='));
    const keyword = keywordArg ? keywordArg.split('=')[1].replace(/"/g, '') : config.defaultSearchKeyword;
    logger.info(`Using search keyword: ${keyword}`);

    while (hasMore && page <= config.maxPages) {
      // URLを動的に生成
      const url = `${config.targetUrl}&search%5Bkeywords%5D=${encodeURIComponent(keyword)}&page=${page}`;
      logger.info(`Scraping URL: ${url}`); // ログにURLを追加
      try {
        await scraper.goto(url);
        const jobs = await scraper.getJobs();
        logger.info(`Extracted jobs from page ${page}: ${jobs.length}`);
        const previousJobCount = allJobs.length; // 追加前の件数を保持
        allJobs = allJobs.concat(jobs);
        const currentJobCount = allJobs.length; // 追加後の件数

        // chunkSize ごとにログを出力
        if (Math.floor(currentJobCount / config.chunkSize) > Math.floor(previousJobCount / config.chunkSize)) {
          logger.info(`--- Processed ${currentJobCount} jobs so far ---`);
          const answer = await askQuestion('Continue to next chunk? (y/n): ');
          if (answer.toLowerCase() !== 'y') {
            logger.info('Stopping scraping process based on user input.');
            hasMore = false; // ループを抜ける
          }
        }

        // ページにジョブがなければ終了
        if (jobs.length === 0) {
          hasMore = false;
        }
      } catch (e) {
        logger.error(`Job extraction failed on page ${page}: ${e}`);
        hasMore = false;
      }
      page++;
    }
    logger.info(`Total jobs extracted: ${allJobs.length}`);
    const savedPathJson = saveDataAsJson(allJobs);
    logger.info(`Saved scraped data to: ${savedPathJson}`);
    // CSVでも保存
    const savedPathCsv = require('./utils/dataSaver').saveDataAsCsv(allJobs);
    logger.info(`Saved scraped data to: ${savedPathCsv}`);
  } catch (e) {
    logger.error(`Fatal error: ${e}`);
  } finally {
    await scraper.close();
    rl.close(); // readlineインターフェースを閉じる
  }
}

main().catch(console.error);
