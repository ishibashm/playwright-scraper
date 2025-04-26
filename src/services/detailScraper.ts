import { Page } from 'playwright';
import { JobItem } from '../types/types';
import logger from '../utils/logger';

// Helper function to extract text content or return null
async function getTextContent(page: Page, selector: string): Promise<string | null> {
  try {
    return await page.textContent(selector, { timeout: 5000 }); // Add timeout
  } catch (error) {
    logger.warn(`Selector not found or timed out: ${selector}`);
    return null;
  }
}

// Helper function to extract number from text or return null
function extractNumber(text: string | null): number | null {
  if (!text) return null;
  const match = text.match(/\d+/);
  return match ? parseInt(match[0], 10) : null;
}

// Helper function to check if an element exists
async function elementExists(page: Page, selector: string): Promise<boolean> {
  try {
    await page.waitForSelector(selector, { state: 'attached', timeout: 1000 }); // Short timeout for existence check
    return true;
  } catch (error) {
    return false;
  }
}

export async function scrapeJobDetails(page: Page): Promise<Partial<JobItem>> {
  const details: Partial<JobItem> = {};

  try {
    // 1. 仕事の詳細説明
    details.detailDescription = (await getTextContent(page, 'section.detail_information td.confirm_outside_link'))?.trim() || undefined;

    // 2. 応募した人数
    const applicantsText = await getTextContent(page, 'section.application_status table tr:nth-child(1) td');
    details.applicantsCount = extractNumber(applicantsText) ?? undefined;

    // 3. 契約した人数
    const contractedText = await getTextContent(page, 'section.application_status table tr:nth-child(2) td');
    details.contractedCount = extractNumber(contractedText) ?? undefined;

    // 4. 募集人数
    const requiredText = await getTextContent(page, 'section.application_status table tr:nth-child(3) td');
    details.requiredCount = extractNumber(requiredText) ?? undefined;

    // 5. 応募期限
    details.applicationDeadline = (await getTextContent(page, 'table.summary th:has-text("応募期限") + td'))?.trim() || undefined;

    // 6. クライアント名
    details.clientName = (await getTextContent(page, 'section.client_detail_information a[href^="/public/employers/"]'))?.trim() || undefined;

    // 7. クライアント評価
    const ratingText = await getTextContent(page, 'section.client_detail_information span.average-score');
    if (ratingText) {
      const ratingMatch = ratingText.match(/(\d+\.\d+)/);
      details.clientRating = ratingMatch ? parseFloat(ratingMatch[1]) : undefined;
    }

    // 8. クライアントレビュー数
    // 8. クライアントレビュー数
    const reviewSelector = 'section.client_detail_information .client_rating span.feedback_summary'; // Define selector
    if (await elementExists(page, reviewSelector)) { // Check if element exists first
      const reviewText = await getTextContent(page, reviewSelector);
      details.clientReviewCount = extractNumber(reviewText) ?? undefined;
    } else {
      // Optionally log or set a default value like 0 if the element doesn't exist
      logger.debug(`Review count element (${reviewSelector}) not found on this page.`); // Use debug level
      details.clientReviewCount = undefined; // Explicitly set to undefined (or 0)
    }

    // 9. 本人確認状況 (未提出なら true)
    details.clientIdentityVerified = !(await elementExists(page, 'section.client_detail_information span.not-identity_verified'));

    // 10. 発注ルールチェック状況 (未回答なら true) - セレクタ修正の可能性あり
    details.clientRuleCheckSucceeded = !(await elementExists(page, 'section.client_detail_information span.not-employer_rule_check_succeeded'));

  } catch (error) {
    logger.error(`Error scraping job details: ${error}`);
    // Return partial data even if some parts fail
  }

  return details;
}