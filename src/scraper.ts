import { Page } from 'playwright';
import { JobItem } from '../src/types/types';

export async function scrapeJobs(page: Page, url: string, nextPage = false): Promise<JobItem[]> {
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  // 案件リストの親要素はdiv.UNzN7
  const jobs: JobItem[] = await page.$$eval('div.UNzN7', (nodes) => {
    return nodes.map((el) => {
      const getText = (selector: string) => (el.querySelector(selector)?.textContent?.trim() || '');
      const getLink = () => {
        const anchor = el.querySelector('a');
        return anchor ? (anchor as HTMLAnchorElement).href : '';
      };
      return {
        title: getText('div.FY2t2, div.WkZ08, div.rGkuO, div.cAtkF'),
        description: getText('div.irB0G, div.FY2t2, div.WkZ08'),
        budget: getText('span[data-budget]'),
        period: getText('span[data-period]'),
        client: getText('div.rGkuO'),
        applicants: 0, // 応募人数のclassは要調査
        link: getLink(),
        additionalData: Array.from(el.querySelectorAll('tr')).find(row => row.querySelector('th')?.textContent?.trim() === '納品希望日')?.querySelector('td')?.textContent?.trim() || ''
      };
    });
  });
  if (nextPage) {
    const nextButton = await page.$('a[rel="next"]');
    if (nextButton) {
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'domcontentloaded' }),
        nextButton.click(),
      ]);
      const jobsNext: JobItem[] = await page.$$eval('div.UNzN7', (nodes) => {
        return nodes.map((el) => {
          const getText = (selector: string) => (el.querySelector(selector)?.textContent?.trim() || '');
          const getLink = () => {
            const anchor = el.querySelector('a');
            return anchor ? (anchor as HTMLAnchorElement).href : '';
          };
          return {
            title: getText('div.FY2t2, div.WkZ08, div.rGkuO, div.cAtkF'),
            description: getText('div.irB0G, div.FY2t2, div.WkZ08'),
            budget: getText('span[data-budget]'),
            period: getText('span[data-period]'),
            client: getText('div.rGkuO'),
            applicants: 0,
            link: getLink(),
            additionalData: Array.from(el.querySelectorAll('tr')).find(row => row.querySelector('th')?.textContent?.trim() === '納品希望日')?.querySelector('td')?.textContent?.trim() || ''
          };
        });
      });
      return jobs.concat(jobsNext);
    }
  }
  return jobs;
}
