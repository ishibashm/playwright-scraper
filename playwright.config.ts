import { defineConfig } from '@playwright/test';

export default defineConfig({
  timeout: 60000, // Increase timeout to 60 seconds
  use: {
    headless: true,
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    navigationTimeout: 30000,
    actionTimeout: 30000,
  },
  retries: 2, // Retry failed tests up to 2 times
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
    {
      name: 'firefox',
      use: { browserName: 'firefox' },
    },
    {
      name: 'webkit',
      use: { browserName: 'webkit' },
    },
  ],
});
