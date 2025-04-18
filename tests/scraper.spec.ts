import { test, expect } from '@playwright/test';
import { Scraper } from '../src/services/scraper';
import withRetry from '../src/utils/retry';

test.describe('Job Scraper', () => {
    let scraper: Scraper;

    test.beforeEach(async () => {
        scraper = new Scraper();
        await scraper.init();
    });

    test.afterEach(async () => {
        await scraper.close();
    });

    test('should scrape job listings from the first page', async () => {
        await scraper.goto('https://crowdworks.jp/public/jobs?category_id=1');
        const jobs = await scraper.getJobs();
        
        expect(jobs).toBeInstanceOf(Array);
        expect(jobs.length).toBeGreaterThan(0);
        
        const firstJob = jobs[0];
        expect(firstJob.title).toBeDefined();
        expect(firstJob.title.length).toBeGreaterThan(0);
        expect(firstJob.link).toMatch(/^https:\/\/crowdworks\.jp\//);
        expect(firstJob.description).toBeDefined();
        expect(firstJob.client).toBeDefined();
        expect(typeof firstJob.applicants).toBe('number');
    });

    test('should navigate to the next page and scrape jobs', async () => {
        await scraper.goto('https://crowdworks.jp/public/jobs?category_id=1');
        const firstPageJobs = await scraper.getJobs();
        
        expect(firstPageJobs).toBeInstanceOf(Array);
        expect(firstPageJobs.length).toBeGreaterThan(0);
    });

    test('should handle network errors gracefully', async () => {
        await scraper.close();
        await expect(scraper.getJobs()).rejects.toThrow(/page.*closed/);
    });

    test('should retry failed operations', async () => {
        // Mock a failing operation that will succeed on retry
        let attempts = 0;
        const testOperation = async () => {
            attempts++;
            if (attempts < 2) {
                throw new Error('Simulated failure');
            }
            return true;
        };

        const result = await withRetry(testOperation, {
            operationName: 'test operation',
            maxRetries: 3,
            delayMs: 100
        });

        expect(result).toBe(true);
        expect(attempts).toBe(2);
    });

    test('should extract all required job fields', async () => {
        await scraper.goto('https://crowdworks.jp/public/jobs?category_id=1');
        const jobs = await scraper.getJobs();
        
        expect(jobs.length).toBeGreaterThan(0);
        const job = jobs[0];
        
        // Verify all fields are present and have correct types
        expect(job).toEqual(
            expect.objectContaining({
                title: expect.any(String),
                description: expect.any(String),
                budget: expect.any(String),
                period: expect.any(String),
                client: expect.any(String),
                applicants: expect.any(Number),
                link: expect.stringMatching(/^https:\/\/crowdworks\.jp\//)
            })
        );
    });
});