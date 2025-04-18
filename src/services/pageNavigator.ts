import { Page } from 'playwright';
import { config } from '../config/config';

export class PageNavigator {
  constructor(private page: Page) {}

  async gotoNextPage(): Promise<boolean> {
    // 現在のページ番号を取得
    const currentPageNum = await this.page.$eval('li.active > a, li.is-active > a, li[aria-current="page"] > a', el => Number(el.textContent?.trim() || '1'));
    // 次のページ番号
    const nextPageNum = currentPageNum + 1;
    // 次のページ番号のリンクを探す
    const nextPageSelector = `li:not(.active):not(.is-active):not([aria-current="page"]) > a:text-is('${nextPageNum}')`;
    const nextPageLink = await this.page.$(nextPageSelector);
    if (nextPageLink) {
      await Promise.all([
        this.page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 20000 }),
        nextPageLink.click(),
      ]);
      await this.page.waitForSelector('div.UNzN7', { state: 'visible', timeout: 10000 });
      await this.page.waitForTimeout(config.pageDelayMs);
      return true;
    }
    return false;
  }
}
