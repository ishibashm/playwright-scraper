import withRetry from '../src/utils/retry';

describe('withRetry utility', () => {
  it('resolves immediately if operation succeeds', async () => {
    const op = jest.fn().mockResolvedValue('ok');
    const result = await withRetry(op, { maxRetries: 3, delayMs: 10, operationName: 'test' });
    expect(result).toBe('ok');
    expect(op).toHaveBeenCalledTimes(1);
  });

  it('retries the specified number of times on failure', async () => {
    let attempts = 0;
    const op = jest.fn().mockImplementation(async () => {
      attempts++;
      if (attempts < 3) throw new Error('fail');
      return 'success';
    });
    const result = await withRetry(op, { maxRetries: 3, delayMs: 10, operationName: 'test' });
    expect(result).toBe('success');
    expect(op).toHaveBeenCalledTimes(3);
  });

  it('throws after exceeding maxRetries', async () => {
    const op = jest.fn().mockRejectedValue(new Error('fail'));
    await expect(withRetry(op, { maxRetries: 2, delayMs: 10, operationName: 'test' })).rejects.toThrow('fail');
    expect(op).toHaveBeenCalledTimes(2);
  });
});
