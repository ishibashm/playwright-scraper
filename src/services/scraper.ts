import { chromium, Browser, Page } from 'playwright';
import { config } from '../config/config';
import { JobItem } from '../types/types';
import logger from '../utils/logger';
import withRetry from '../utils/retry';

export class Scraper {
  private browser: Browser | null = null;
  public page: Page | null = null; // Make page public or add a getter

  // Optional: Add a getter if you prefer to keep the property private
  // public get currentPage(): Page | null {
  //   return this.page;
  // }

  async init(): Promise<void> {
    try {
      this.browser = await chromium.launch({ 
        headless: true,
        args: ['--disable-dev-shm-usage'] // Helps with memory issues
      });
      this.page = await this.browser.newPage({
        userAgent: config.userAgent,
      });
      logger.info('Browser initialized successfully');
    } catch (error) {
      logger.error(`Failed to initialize browser: ${error}`);
      throw error;
    }
  }

  async goto(url: string): Promise<void> {
    if (!this.page) throw new Error('Page not initialized');
    await withRetry(
      async () => {
        await this.page!.goto(url, { 
          waitUntil: 'domcontentloaded',
          timeout: 30000
        });
        // Remove the list-page specific wait from here
        // await this.page!.waitForSelector('div.UNzN7', {
        //   state: 'visible',
        //   timeout: 10000
        // });
        logger.info(`Navigated to ${url}`);
      },
      { operationName: 'Page navigation', maxRetries: 3, delayMs: 2000 }
    );
  }

  async getJobs(): Promise<JobItem[]> {
    if (!this.page) throw new Error('Page not initialized');
    return withRetry(
      async () => {
        const jobs = await this.page!.evaluate(() => {
          const jobCards = document.querySelectorAll('div.UNzN7');
          return Array.from(jobCards).map(jobCard => {
            // タイトル
            const title = jobCard.querySelector('div.FY2t2 div.WkZ08 h3 a')?.textContent?.trim() || '';
            // リンク
            const linkElem = jobCard.querySelector('div.FY2t2 div.WkZ08 h3 a');
            const link = linkElem && 'href' in linkElem ? (linkElem as HTMLAnchorElement).href : '';
            // 説明文
            const description = jobCard.querySelector('div.irB0G, div.Mm0nv')?.textContent?.trim() || '';
            // クライアント情報
            const clientInfo = jobCard.querySelector('div.rGkuO a.uxHdW')?.textContent?.trim() || '';
            // 予算
            const budget = jobCard.querySelector('span.lCkhZ, span.Yh37y')?.textContent?.replace(/,/g, '').trim() || '';
            // 応募人数（契約数）
            const applicantsText = jobCard.querySelector('b.D0ZNl')?.textContent?.trim() || '0';
            const applicants = Number(applicantsText.replace(/[^0-9]/g, ''));
            // 期間（例：あと○日/時間）
            const period = jobCard.querySelector('b.GQEZv')?.textContent?.replace(/あと|日|時間/g, '').trim() || '';
            return {
              title,
              description,
              budget,
              period,
              client: clientInfo,
              applicants,
              link
            };
          }).filter((job): job is JobItem => job !== null && job.title !== '');
        });
        if (!jobs || jobs.length === 0) {
          logger.warn('No jobs extracted: セレクタやページ構造の変更の可能性があります。');
          const html = await this.page!.content();
          require('fs').writeFileSync('debug-latest.html', html, 'utf-8');
        }
        return jobs;
      },
      { operationName: 'Job extraction', maxRetries: 3, delayMs: 1000 }
    );
  }

  async close(): Promise<void> {
    try {
      await this.page?.close();
      await this.browser?.close();
      logger.info('Browser closed successfully');
    } catch (error) {
      logger.error(`Failed to close browser: ${error}`);
      throw error;
    }
  }
}
