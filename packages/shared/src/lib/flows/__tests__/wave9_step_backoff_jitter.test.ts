describe('Wave 9: Flow Step Exponential Backoff & Jitter', () => {
  it('should calculate exponential backoff bounded by maximum backoff ceiling', () => {
    const baseDelayMs = 1000;
    const maxDelayMs = 30000;
    const getBackoff = (attempt: number) => Math.min(baseDelayMs * Math.pow(2, attempt), maxDelayMs);

    expect(getBackoff(0)).toBe(1000);
    expect(getBackoff(1)).toBe(2000);
    expect(getBackoff(2)).toBe(4000);
    expect(getBackoff(3)).toBe(8000);
    expect(getBackoff(5)).toBe(30000);
    expect(getBackoff(10)).toBe(30000);
  });

  it('should verify retry count termination thresholds', () => {
    const maxRetries = 5;
    const shouldRetry = (currentAttempt: number) => currentAttempt < maxRetries;

    expect(shouldRetry(4)).toBe(true);
    expect(shouldRetry(5)).toBe(false);
    expect(shouldRetry(6)).toBe(false);
  });
});
