import dotenv from 'dotenv';

dotenv.config();

export const config = {
  baseUrl: process.env.BASE_URL || 'https://crowdworks.jp/public/jobs/search?hide_expired=true&order=new&search%5Bkeywords%5D=%E3%82%B7%E3%83%A7%E3%83%BC%E3%83%88',
  dataDir: process.env.DATA_DIR || './data',
  userAgent: process.env.USER_AGENT || 'Mozilla/5.0 (compatible; ScraperBot/1.0)',
  pageDelayMs: Number(process.env.PAGE_DELAY_MS) || 2000,
  maxConcurrency: Number(process.env.MAX_CONCURRENCY) || 3,
  chunkSize: Number(process.env.CHUNK_SIZE) || 5, // Added chunkSize
  supabaseUrl: process.env.SUPABASE_URL || 'https://jrjbuofsphtuvhkazxub.supabase.co',
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpyamJ1b2ZzcGh0dXZoa2F6eHViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg2ODA3MzcsImV4cCI6MjA2NDI1NjczN30.OgRRFzuAmWjfNDtxG3u-5GybyrqWRaKlfRrkZYv4_r8',
};
