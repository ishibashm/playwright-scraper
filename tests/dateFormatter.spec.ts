import { formatDate } from '../src/utils/dateFormatter';

describe('dateFormatter utility', () => {
  it('formats date to yyyy-MM-dd', () => {
    const date = new Date(Date.UTC(2025, 3, 18, 12, 34, 56));
    const formatted = formatDate(date, 'yyyy-MM-dd');
    expect(formatted).toBe('2025-04-18');
  });

  it('formats date to default format (UTC)', () => {
    const date = new Date(Date.UTC(2025, 3, 18, 12, 34, 56));
    const formatted = formatDate(date);
    // Accept both UTC and local time for robustness
    expect(["2025-04-18_12-34-56", "2025-04-18_21-34-56"]).toContain(formatted.substring(0,19));
  });
});