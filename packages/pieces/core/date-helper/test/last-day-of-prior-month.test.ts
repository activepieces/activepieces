/// <reference types="vitest/globals" />

import { lastDayOfPreviousMonthAction } from '../src/lib/actions/last-day-of-prior-month';
import { createMockActionContext } from '@activepieces/pieces-framework';

describe('lastDayOfPreviousMonth', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-06-15T10:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('returns last day of previous month', async () => {
    const ctx = createMockActionContext({
      propsValue: {
        time: '00:00',
        currentTime: false,
        timeFormat: 'YYYY-MM-DD HH:mm:ss',
        timeZone: 'UTC',
      },
    });
    const result = await lastDayOfPreviousMonthAction.run(ctx);
    expect(result).toEqual({ result: '2024-05-31 00:00:00' });
  });

  test('handles February (non-leap year)', async () => {
    vi.setSystemTime(new Date('2023-03-15T10:00:00Z'));
    const ctx = createMockActionContext({
      propsValue: {
        time: '00:00',
        currentTime: false,
        timeFormat: 'YYYY-MM-DD HH:mm:ss',
        timeZone: 'UTC',
      },
    });
    const result = await lastDayOfPreviousMonthAction.run(ctx);
    expect(result).toEqual({ result: '2023-02-28 00:00:00' });
  });

  test('handles February (leap year)', async () => {
    vi.setSystemTime(new Date('2024-03-15T10:00:00Z'));
    const ctx = createMockActionContext({
      propsValue: {
        time: '00:00',
        currentTime: false,
        timeFormat: 'YYYY-MM-DD HH:mm:ss',
        timeZone: 'UTC',
      },
    });
    const result = await lastDayOfPreviousMonthAction.run(ctx);
    expect(result).toEqual({ result: '2024-02-29 00:00:00' });
  });

  test('returns with custom time', async () => {
    const ctx = createMockActionContext({
      propsValue: {
        time: '23:59',
        currentTime: false,
        timeFormat: 'YYYY-MM-DD HH:mm:ss',
        timeZone: 'UTC',
      },
    });
    const result = await lastDayOfPreviousMonthAction.run(ctx);
    expect(result).toEqual({ result: '2024-05-31 23:59:00' });
  });
});
