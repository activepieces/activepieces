/// <reference types="vitest/globals" />

import { nextDayofYear } from '../src/lib/actions/next-day-of-year';
import { createMockActionContext } from '@activepieces/pieces-framework';

describe('nextDayOfYear', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-06-15T10:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('gets future date in same year', async () => {
    const ctx = createMockActionContext({
      propsValue: {
        month: 12, // December
        day: 25,
        time: '00:00',
        currentTime: false,
        timeFormat: 'YYYY-MM-DD HH:mm:ss',
        timeZone: 'UTC',
      },
    });
    const result = await nextDayofYear.run(ctx);
    expect(result).toEqual({ result: '2024-12-25 00:00:00' });
  });

  test('gets past date rolls to next year', async () => {
    const ctx = createMockActionContext({
      propsValue: {
        month: 1, // January
        day: 1,
        time: '00:00',
        currentTime: false,
        timeFormat: 'YYYY-MM-DD HH:mm:ss',
        timeZone: 'UTC',
      },
    });
    const result = await nextDayofYear.run(ctx);
    expect(result).toEqual({ result: '2025-01-01 00:00:00' });
  });

  test('returns date-only format', async () => {
    const ctx = createMockActionContext({
      propsValue: {
        month: 7,
        day: 4,
        time: '00:00',
        currentTime: false,
        timeFormat: 'YYYY-MM-DD',
        timeZone: 'UTC',
      },
    });
    const result = await nextDayofYear.run(ctx);
    expect(result).toEqual({ result: '2024-07-04' });
  });
});
