import dotenv from 'dotenv';

dotenv.config();

export const config = {
  baseUrl: process.env.BASE_URL || 'https://crowdworks.jp/public/jobs/search?hide_expired=true&order=new&search%5Bkeywords%5D=%E3%82%B7%E3%83%A7%E3%83%BC%E3%83%88',
  dataDir: process.env.DATA_DIR || './data',
  userAgent: process.env.USER_AGENT || 'Mozilla/5.0 (compatible; ScraperBot/1.0)',
  pageDelayMs: Number(process.env.PAGE_DELAY_MS) || 2000,
  maxConcurrency: Number(process.env.MAX_CONCURRENCY) || 3,
  chunkSize: Number(process.env.CHUNK_SIZE) || 5, // Added chunkSize
};
