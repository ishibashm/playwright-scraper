import { Scraper } from './services/scraper';
import { saveDataAsJson } from './utils/dataSaver';
import { JobItem } from './types/types';
import { config } from './config';
import logger from './utils/logger';

async function main() {
  const scraper = new Scraper();
  try {
    await scraper.init();
    let allJobs: JobItem[] = [];
    let page = 1;
    let hasMore = true;
    while (hasMore && page <= config.maxPages) {
      const url = `${config.targetUrl}&page=${page}`;
      try {
        await scraper.goto(url);
        const jobs = await scraper.getJobs();
        logger.info(`Extracted jobs from page ${page}: ${jobs.length}`);
        allJobs = allJobs.concat(jobs);
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
    const savedPath = saveDataAsJson(allJobs);
    logger.info(`Saved scraped data to: ${savedPath}`);
  } catch (e) {
    logger.error(`Fatal error: ${e}`);
  } finally {
    await scraper.close();
  }
}

main().catch(console.error);
