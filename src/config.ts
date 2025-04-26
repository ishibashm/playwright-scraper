// src/config.ts

export const config = {
  targetUrl: 'https://crowdworks.jp/public/jobs/search?order=new', // ベースURLのみにする
  defaultSearchKeyword: 'ショート', // デフォルトキーワードを追加
  jobListingSelector: '.job-listing', // Adjust this selector based on the actual HTML structure
  nextPageSelector: '.pagination-next', // Adjust this selector based on the actual HTML structure
  maxPages: 5, // Define how many pages to scrape
  chunkSize: 5, // Number of jobs to process before logging progress
  timeout: 30000, // Timeout for page navigation
} as const;