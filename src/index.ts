import * as readline from 'readline';
import { stdin as input, stdout as output } from 'process';
import * as fs from 'fs';
import * as path from 'path';
import Papa from 'papaparse'; // Import papaparse
import { Scraper } from './services/scraper';
import { scrapeJobDetails } from './services/detailScraper';
import { saveDataAsJson, saveDataAsCsv } from './utils/dataSaver';
import { uploadFileToDrive } from './utils/googleDriveUploader'; // ★ 追加
import { JobItem } from './types/types';
import { config } from './config';
import logger from './utils/logger';

// Helper function to parse CSV data
function parseCsvData(csvData: string): JobItem[] {
    const result = Papa.parse<JobItem>(csvData, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: (header) => {
            // Attempt to convert numeric fields based on header name
            // Use type assertion for header as papaparse types might be broad
            return ['applicants', 'applicantsCount', 'contractedCount', 'requiredCount', 'clientRating', 'clientReviewCount'].includes(header as string);
        },
        transformHeader: (header) => header.trim(), // Trim header spaces
        transform: (value, header) => {
             // Handle boolean strings explicitly if dynamicTyping isn't enough
             if (['clientIdentityVerified', 'clientRuleCheckSucceeded'].includes(header as string)) {
                 if (value.toLowerCase() === 'true') return true;
                 if (value.toLowerCase() === 'false') return false;
             }
             // Ensure empty strings become undefined for optional fields if needed, or handle as empty string
             // For simplicity, PapaParse might handle empty strings okay, but check output
             return value === '' ? undefined : value;
        }
    });

    if (result.errors.length > 0) {
        logger.error('CSV parsing errors:', result.errors);
        // Depending on severity, you might throw an error or just log warnings
    }
    // Ensure numeric types are correct after dynamicTyping
     return result.data.map(item => ({
        ...item,
        applicants: typeof item.applicants === 'number' ? item.applicants : 0, // Default if parsing failed
        applicantsCount: typeof item.applicantsCount === 'number' ? item.applicantsCount : undefined,
        contractedCount: typeof item.contractedCount === 'number' ? item.contractedCount : undefined,
        requiredCount: typeof item.requiredCount === 'number' ? item.requiredCount : undefined,
        clientRating: typeof item.clientRating === 'number' ? item.clientRating : undefined,
        clientReviewCount: typeof item.clientReviewCount === 'number' ? item.clientReviewCount : undefined,
        // Booleans might need explicit check if transform didn't catch all cases
        clientIdentityVerified: typeof item.clientIdentityVerified === 'boolean' ? item.clientIdentityVerified : undefined,
        clientRuleCheckSucceeded: typeof item.clientRuleCheckSucceeded === 'boolean' ? item.clientRuleCheckSucceeded : undefined,
    }));
}


async function main() {
  const scraper = new Scraper();
  const rl = readline.createInterface({ input, output });

  const askQuestion = (query: string): Promise<string> => {
    return new Promise(resolve => rl.question(query, resolve));
  };

console.log('Raw arguments:', process.argv); // Log raw arguments for debugging
  // --- Argument Parsing ---
  const args = process.argv.slice(2); // Get only script arguments
  const inputFileArg = args.find(arg => arg.startsWith('--input-file='));
  let inputFilePath = inputFileArg ? inputFileArg.split('=')[1] : null;
  if (inputFilePath) {
    // Remove surrounding quotes if present (from batch file or user input)
    inputFilePath = inputFilePath.replace(/^"|"$/g, '');
  }
  logger.info(`Processed input file path: ${inputFilePath}`); // Add log for debugging
  const maxJobsArg = args.find(arg => arg.startsWith('--max-jobs='));
  let maxJobsLimit: number | null = null;
  if (maxJobsArg) {
    const limitStr = maxJobsArg.split('=')[1];
    const limitNum = parseInt(limitStr, 10);
    if (!isNaN(limitNum) && limitNum > 0) {
      maxJobsLimit = limitNum;
      logger.info(`Maximum number of jobs to process set to: ${maxJobsLimit}`);
    } else {
      logger.warn(`Invalid value for --max-jobs: "${limitStr}". Ignoring limit.`);
    }
  }
  // Use args array for keyword parsing as well
  const keywordArg = args.find(arg => arg.startsWith('--keyword='));
  const keyword = keywordArg ? keywordArg.split('=')[1].replace(/"/g, '') : config.defaultSearchKeyword;
  const startPageArg = args.find(arg => arg.startsWith('--start-page='));
  let startPageNum = 1; // Default start page
  if (startPageArg) {
      const pageStr = startPageArg.split('=')[1];
      const pageNumParsed = parseInt(pageStr, 10);
      if (!isNaN(pageNumParsed) && pageNumParsed > 0) {
          startPageNum = pageNumParsed;
          logger.info(`Starting list scraping from page: ${startPageNum}`);
      } else {
          logger.warn(`Invalid value for --start-page: "${pageStr}". Starting from page 1.`);
      }
  }
  const skipChunkConfirm = process.env.GITHUB_ACTIONS === 'true' ? true : args.includes('--skip-chunk-confirm');
  const forceFetchDetails = process.env.GITHUB_ACTIONS === 'true' ? true : args.includes('--fetch-details');
  const forceNoFetchDetails = args.includes('--no-fetch-details'); // ★ 追加
  // --- End Argument Parsing ---

  let allJobsData: JobItem[] = []; // This will hold the final data
  let jobsToProcessDetails: JobItem[] = []; // Jobs needing detail scraping
  let isResumeMode = false;

  try {
    await scraper.init();

    if (inputFilePath) {
      // --- Resume Mode: Load from input file ---
      logger.info(`Input file specified: ${inputFilePath}. Attempting to resume.`);
      isResumeMode = true;
      if (!fs.existsSync(inputFilePath)) {
        throw new Error(`Input file not found: ${inputFilePath}`);
      }
      try {
        const fileContent = fs.readFileSync(inputFilePath, 'utf-8');
        const fileExt = path.extname(inputFilePath).toLowerCase();

        if (fileExt === '.json') {
          allJobsData = JSON.parse(fileContent);
          logger.info(`Loaded ${allJobsData.length} jobs from JSON file.`);
        } else if (fileExt === '.csv') {
          allJobsData = parseCsvData(fileContent); // Use PapaParse helper
          logger.info(`Loaded ${allJobsData.length} jobs from CSV file.`);
        } else {
          throw new Error(`Unsupported input file format: ${fileExt}. Please use .json or .csv`);
        }

        // Filter for jobs that need detail scraping (e.g., missing detailDescription)
        jobsToProcessDetails = allJobsData.filter(job => !job.detailDescription && !job.error); // Also skip jobs that previously failed
        logger.info(`Found ${jobsToProcessDetails.length} jobs requiring detail scraping.`);

        if (jobsToProcessDetails.length === 0) {
          logger.info('No jobs require detail scraping from the input file.');
          // Proceed directly to saving (or exit)
        }

      } catch (err) {
        logger.error(`Error reading or parsing input file "${inputFilePath}": ${err}. Exiting.`);
        return; // Exit if input file is invalid
      }

    } else {
      // --- Normal Mode: Scrape from scratch ---
      logger.info('--- Starting Phase 1: Scraping Job Summaries ---');
      logger.info(`Using search keyword: ${keyword}`);
      let pageNum = startPageNum; // Use startPageNum here
      let hasMorePages = true;

      while (hasMorePages && pageNum <= config.maxPages) {
        if (maxJobsLimit !== null && allJobsData.length >= maxJobsLimit) {
          logger.info(`Reached max job limit (${maxJobsLimit}) during summary scraping.`);
          hasMorePages = false;
          break;
        }

        const listUrl = `${config.targetUrl}&search%5Bkeywords%5D=${encodeURIComponent(keyword)}&page=${pageNum}`;
        logger.info(`Scraping list page: ${listUrl}`);
        try {
          await scraper.goto(listUrl);
          logger.info(`Waiting for list page content to load: ${listUrl}`);
          await scraper.page!.waitForSelector('div.UNzN7', { state: 'visible', timeout: 15000 });
          logger.info(`List page content loaded.`);

          const jobsOnPage = await scraper.getJobs();
          logger.info(`Extracted ${jobsOnPage.length} job summaries from page ${pageNum}.`);

          if (jobsOnPage.length === 0) {
            logger.info('No more job summaries found on this page.');
            hasMorePages = false;
            break;
          }

          const remainingSlots = maxJobsLimit !== null ? maxJobsLimit - allJobsData.length : Infinity;
          const jobsToAdd = jobsOnPage.slice(0, remainingSlots);
          allJobsData = allJobsData.concat(jobsToAdd);

          if (maxJobsLimit !== null && allJobsData.length >= maxJobsLimit) {
            logger.info(`Reached max job limit (${maxJobsLimit}) after scraping page ${pageNum}.`);
            hasMorePages = false;
            break;
          }

          const nextButton = await scraper.page?.$('a[rel="next"]');
          if (!nextButton) {
            logger.info('No next page button found.');
            hasMorePages = false;
          }

        } catch (e) {
          logger.error(`Error processing list page ${pageNum}: ${e}`);
          const continueOnError = await askQuestion(`Error on page ${pageNum}. Continue to next page? (y/n): `);
          if (continueOnError.toLowerCase() !== 'y') {
            hasMorePages = false;
          }
        }

        if (hasMorePages) {
          pageNum++;
        }
      }
      logger.info(`--- Finished Phase 1: Total ${allJobsData.length} job summaries collected ---`);
      jobsToProcessDetails = allJobsData; // In normal mode, all collected summaries need details
    } // End of Mode Branching

    // --- Phase 2: User Confirmation and Detail Scraping ---
    let fetchDetailsDecision = 'n'; // Default to no
    if (forceFetchDetails) {
      fetchDetailsDecision = 'y';
      logger.info('Detail scraping will be performed due to --fetch-details flag.');
    } else if (forceNoFetchDetails) {
      fetchDetailsDecision = 'n';
      logger.info('Detail scraping will be skipped due to --no-fetch-details flag.');
    } else {
      // No force flags, ask the user if there are jobs to process
      if (jobsToProcessDetails.length > 0) {
          fetchDetailsDecision = await askQuestion(`Found ${jobsToProcessDetails.length} jobs requiring details. Fetch details now? (y/n): `);
      } else if (!isResumeMode) {
          logger.info('No job summaries collected in Phase 1, skipping detail fetch question.');
      }
    }

    if (fetchDetailsDecision.toLowerCase() === 'y' && jobsToProcessDetails.length > 0) {
      logger.info('--- Starting Phase 2: Scraping Job Details ---');
      let processedDetailCount = 0;
      let actualProcessedIndex = 0; // Index within jobsToProcessDetails
      let stopDetailScraping = false;

      // Loop through only the jobs needing details
      for (let jobRef of jobsToProcessDetails) {
        // Check maxJobsLimit based on how many we *attempt* in this run
        if (maxJobsLimit !== null && actualProcessedIndex >= maxJobsLimit) {
             logger.info(`Reached max job limit (${maxJobsLimit}) for this run.`);
            break;
        }
        if (stopDetailScraping) break;

        actualProcessedIndex++; // Increment index for the item we are about to process

        if (jobRef.link && jobRef.link.startsWith('http')) {
          try {
            logger.info(`(${actualProcessedIndex}/${jobsToProcessDetails.length}) Navigating to detail page: ${jobRef.link}`);
            await scraper.goto(jobRef.link);
            logger.info(`Waiting for detail page content to load: ${jobRef.link}`);
            await scraper.page!.waitForSelector('section.job_offer_detail_header', { state: 'visible', timeout: 15000 });
            logger.info(`Detail page content loaded.`);

            const details = await scrapeJobDetails(scraper.page!);
            logger.info(`Successfully scraped details for job: ${jobRef.title}`);
            Object.assign(jobRef, details); // Update the object (which is also in allJobsData if resuming)
            processedDetailCount++;

          } catch (detailError) {
            logger.error(`Failed to process detail page for job "${jobRef.title}" at ${jobRef.link}: ${detailError}`);
            jobRef.error = `Detail scraping failed: ${detailError}`; // Update the object
          }
        } else {
          logger.warn(`Job "${jobRef.title}" has invalid or missing link: "${jobRef.link}". Skipping detail scraping.`);
          jobRef.error = 'Invalid or missing link'; // Update the object
        }

        // --- Chunk Confirmation Logic ---
        if (actualProcessedIndex > 0 && actualProcessedIndex % config.chunkSize === 0) {
           logger.info(`--- Attempted processing details for ${actualProcessedIndex} jobs so far (${processedDetailCount} successful) ---`);
           if (maxJobsLimit !== null && actualProcessedIndex >= maxJobsLimit) {
               logger.info(`Max job limit (${maxJobsLimit}) reached during chunk confirmation.`);
               break;
           }
           if (!skipChunkConfirm) {
             const continueChunk = await askQuestion('Continue fetching details for the next chunk? (y/n): ');
             if (continueChunk.toLowerCase() !== 'y') {
               logger.info('Stopping detail scraping process based on user input.');
               stopDetailScraping = true;
             }
           } // skipChunkConfirmがtrueなら何も聞かずに進む
         }
        // --- End Chunk Confirmation ---
      }
      logger.info(`--- Finished Phase 2: Successfully processed details for ${processedDetailCount} new jobs ---`);
    } else {
      logger.info('Skipping detail scraping phase.');
    }

    // --- Phase 3: Save Data ---
    // --- Phase 3: Save Data ---
    // Always save the potentially updated allJobsData
    const finalDataToSave = allJobsData; // Use the main array which was updated by reference
    logger.info(`Total jobs to save: ${finalDataToSave.length}`);
    if (finalDataToSave.length > 0) {
        // Generate a new timestamped filename, possibly indicating if it's a resumed run
        const outputSuffix = isResumeMode ? '-resumed' : '';
        const savedPathJson = saveDataAsJson(finalDataToSave, outputSuffix); // Pass suffix to saver
        logger.info(`Saved scraped data to: ${savedPathJson}`);
        const savedPathCsv = saveDataAsCsv(finalDataToSave, outputSuffix); // Pass suffix to saver
        logger.info(`Saved scraped data to: ${savedPathCsv}`);

        // --- Google Driveへのアップロード処理 --- ★ 追加ブロックここから
        if (savedPathCsv) {
          const googleDriveFolderId = '1CAA4Hq_wh2fGQkFzoUOxrD8VPjmCbYH4'; // ★ ユーザー指定のフォルダID
          try {
            logger.info(`Attempting to upload ${savedPathCsv} to Google Drive...`);
            const fileId = await uploadFileToDrive(savedPathCsv, googleDriveFolderId);
            if (fileId) {
              logger.info(`Successfully uploaded to Google Drive. File ID: ${fileId}`);
            } else {
              logger.warn('Upload to Google Drive may have failed (no file ID returned).');
            }
          } catch (uploadError) {
            logger.error(`Failed to upload ${savedPathCsv} to Google Drive: ${uploadError}`);
          }
        }
        // --- Google Driveへのアップロード処理 --- ★ 追加ブロックここまで
    } else {
        logger.info('No data to save.');
    }


  } catch (e) {
    logger.error(`Fatal error during script execution: ${e}`);
  } finally {
    await scraper.close();
    rl.close();
    logger.info('Scraping process finished.');
  }
}

main().catch(console.error);

// Modify dataSaver functions to accept optional suffix
// This part should be in src/utils/dataSaver.ts, but included here for context
/*
export function saveDataAsJson(data: any, suffix: string = '') {
  // ... existing code ...
  const timestamp = formatDate(new Date());
  const filePath = path.join(config.dataDir, `scraped-${timestamp}${suffix}.json`); // Add suffix
  // ... rest of saving code ...
}

export function saveDataAsCsv(data: any[], suffix: string = '') {
  // ... existing code ...
  const timestamp = formatDate(new Date());
  const filePath = path.join(config.dataDir, `scraped-${timestamp}${suffix}.csv`); // Add suffix
  // ... rest of saving code ...
}
*/
