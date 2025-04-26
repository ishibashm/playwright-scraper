import * as readline from 'readline';
import { stdin as input, stdout as output } from 'process';
import { Scraper } from './services/scraper';
import { scrapeJobDetails } from './services/detailScraper';
import { saveDataAsJson, saveDataAsCsv } from './utils/dataSaver'; // Import both savers
import { JobItem } from './types/types';
import { config } from './config';
import logger from './utils/logger';

async function main() {
  const scraper = new Scraper();
  const rl = readline.createInterface({ input, output });

  const askQuestion = (query: string): Promise<string> => {
    return new Promise(resolve => rl.question(query, resolve));
  };

  try {
    await scraper.init();
    let allJobSummaries: JobItem[] = []; // Store summaries first
    let pageNum = 1;
    let hasMorePages = true;

    // --- Phase 1: Scrape Job Summaries ---
    logger.info('--- Starting Phase 1: Scraping Job Summaries ---');
    const keywordArg = process.argv.find(arg => arg.startsWith('--keyword='));
    const keyword = keywordArg ? keywordArg.split('=')[1].replace(/"/g, '') : config.defaultSearchKeyword;
    logger.info(`Using search keyword: ${keyword}`);

    while (hasMorePages && pageNum <= config.maxPages) {
      const listUrl = `${config.targetUrl}&search%5Bkeywords%5D=${encodeURIComponent(keyword)}&page=${pageNum}`;
      logger.info(`Scraping list page: ${listUrl}`);
      try {
        await scraper.goto(listUrl);
        logger.info(`Waiting for list page content to load: ${listUrl}`);
        await scraper.page!.waitForSelector('div.UNzN7', { state: 'visible', timeout: 15000 });
        logger.info(`List page content loaded.`);

        const jobsOnPage = await scraper.getJobs(); // Assuming getJobs only gets summaries now
        logger.info(`Extracted ${jobsOnPage.length} job summaries from page ${pageNum}.`);

        if (jobsOnPage.length === 0) {
          logger.info('No more job summaries found on this page.');
          hasMorePages = false;
          break;
        }

        allJobSummaries = allJobSummaries.concat(jobsOnPage);

        // Check for next page button (modify Scraper.getJobs or add logic here)
        const nextButton = await scraper.page?.$('a[rel="next"]'); // Example selector
        if (!nextButton) {
          logger.info('No next page button found.');
          hasMorePages = false;
        }

      } catch (e) {
        logger.error(`Error processing list page ${pageNum}: ${e}`);
        // Decide if you want to stop or try the next page
        const continueOnError = await askQuestion(`Error on page ${pageNum}. Continue to next page? (y/n): `);
        if (continueOnError.toLowerCase() !== 'y') {
          hasMorePages = false;
        }
      }

      if (hasMorePages) {
        pageNum++;
      }
    }
    logger.info(`--- Finished Phase 1: Total ${allJobSummaries.length} job summaries collected ---`);

    // --- Phase 2: User Confirmation and Detail Scraping ---
    let allJobsWithDetails: JobItem[] = [...allJobSummaries]; // Initialize with summaries
    const fetchDetailsAnswer = await askQuestion(`Collected ${allJobSummaries.length} job summaries. Fetch details now? (y/n): `);

    if (fetchDetailsAnswer.toLowerCase() === 'y') {
      logger.info('--- Starting Phase 2: Scraping Job Details ---');
      let processedDetailCount = 0;
      let stopDetailScraping = false;

      for (let i = 0; i < allJobSummaries.length; i++) {
        if (stopDetailScraping) break;
        const jobSummary = allJobSummaries[i];

        if (jobSummary.link && jobSummary.link.startsWith('http')) {
          try {
            logger.info(`(${i + 1}/${allJobSummaries.length}) Navigating to detail page: ${jobSummary.link}`);
            await scraper.goto(jobSummary.link);
            logger.info(`Waiting for detail page content to load: ${jobSummary.link}`);
            await scraper.page!.waitForSelector('section.job_offer_detail_header', { state: 'visible', timeout: 15000 });
            logger.info(`Detail page content loaded.`);

            const details = await scrapeJobDetails(scraper.page!);
            logger.info(`Successfully scraped details for job: ${jobSummary.title}`);
            // Merge details into the corresponding object in allJobsWithDetails
            Object.assign(allJobsWithDetails[i], details);
            processedDetailCount++;

          } catch (detailError) {
            logger.error(`Failed to process detail page for job "${jobSummary.title}" at ${jobSummary.link}: ${detailError}`);
            // Optionally add error info to the job item
            allJobsWithDetails[i].error = `Detail scraping failed: ${detailError}`;
          }
        } else {
          logger.warn(`Job "${jobSummary.title}" has invalid or missing link: "${jobSummary.link}". Skipping detail scraping.`);
          allJobsWithDetails[i].error = 'Invalid or missing link';
        }

        // --- Chunk Confirmation Logic for Details ---
        if (processedDetailCount > 0 && processedDetailCount % config.chunkSize === 0) {
           logger.info(`--- Processed details for ${processedDetailCount} jobs so far ---`);
           const continueChunk = await askQuestion('Continue fetching details for the next chunk? (y/n): ');
           if (continueChunk.toLowerCase() !== 'y') {
             logger.info('Stopping detail scraping process based on user input.');
             stopDetailScraping = true;
           }
         }
        // --- End Chunk Confirmation ---
      }
      logger.info(`--- Finished Phase 2: Processed details for ${processedDetailCount} jobs ---`);
    } else {
      logger.info('Skipping detail scraping phase based on user input.');
    }

    // --- Phase 3: Save Data ---
    logger.info(`Total jobs to save: ${allJobsWithDetails.length}`);
    const savedPathJson = saveDataAsJson(allJobsWithDetails);
    logger.info(`Saved scraped data to: ${savedPathJson}`);
    const savedPathCsv = saveDataAsCsv(allJobsWithDetails); // Use imported function
    logger.info(`Saved scraped data to: ${savedPathCsv}`);

  } catch (e) {
    logger.error(`Fatal error during script execution: ${e}`);
  } finally {
    await scraper.close();
    rl.close();
    logger.info('Scraping process finished.');
  }
}

main().catch(console.error);
