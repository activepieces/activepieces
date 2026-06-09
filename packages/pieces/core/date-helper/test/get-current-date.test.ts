/// <reference types="vitest/globals" />

import { getCurrentDate } from '../src/lib/actions/get-current-date';
import { createMockActionContext } from '@activepieces/pieces-framework';

describe('getCurrentDate', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-06-15T12:30:45Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('returns current date in default format with UTC', async () => {
    const ctx = createMockActionContext({
      propsValue: { timeFormat: 'YYYY-MM-DD HH:mm:ss', timeZone: 'UTC' },
    });
    const result = await getCurrentDate.run(ctx);
    expect(result).toEqual({ result: '2024-06-15 12:30:45' });
  });

  test('returns current date in ISO format', async () => {
    const ctx = createMockActionContext({
      propsValue: { timeFormat: 'YYYY-MM-DDTHH:mm:ss', timeZone: 'UTC' },
    });
    const result = await getCurrentDate.run(ctx);
    expect(result).toEqual({ result: '2024-06-15T12:30:45' });
  });

  test('converts to different timezone', async () => {
    const ctx = createMockActionContext({
      propsValue: { timeFormat: 'YYYY-MM-DD HH:mm:ss', timeZone: 'America/New_York' },
    });
    const result = await getCurrentDate.run(ctx);
    // UTC 12:30 = ET 08:30 (EDT, -4 in June)
    expect(result).toEqual({ result: '2024-06-15 08:30:45' });
  });

  test('returns date-only format', async () => {
    const ctx = createMockActionContext({
      propsValue: { timeFormat: 'YYYY-MM-DD', timeZone: 'UTC' },
    });
    const result = await getCurrentDate.run(ctx);
    expect(result).toEqual({ result: '2024-06-15' });
  });
});
