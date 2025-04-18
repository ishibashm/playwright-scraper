// src/config.ts

export const config = {
  targetUrl:
    'https://crowdworks.jp/public/jobs/search?order=new&search%5Bkeywords%5D=%E3%82%B7%E3%83%A7%E3%83%BC%E3%83%88',
  jobListingSelector: '.job-listing', // Adjust this selector based on the actual HTML structure
  nextPageSelector: '.pagination-next', // Adjust this selector based on the actual HTML structure
  maxPages: 5, // Define how many pages to scrape
  timeout: 30000, // Timeout for page navigation
} as const;