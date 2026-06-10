/// <reference types="vitest/globals" />

import { nextDayofWeek } from '../src/lib/actions/next-day-of-week';
import { createMockActionContext } from '@activepieces/pieces-framework';

describe('nextDayOfWeek', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // June 15, 2024 is a Saturday (day 6)
    vi.setSystemTime(new Date('2024-06-15T10:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('gets next Monday from Saturday', async () => {
    const ctx = createMockActionContext({
      propsValue: {
        weekday: 1, // Monday
        time: '09:00',
        currentTime: false,
        timeFormat: 'YYYY-MM-DD HH:mm:ss',
        timeZone: 'UTC',
      },
    });
    const result = await nextDayofWeek.run(ctx);
    expect(result).toEqual({ result: '2024-06-17 09:00:00' });
  });

  test('gets next Saturday (skips to next week)', async () => {
    const ctx = createMockActionContext({
      propsValue: {
        weekday: 6, // Saturday
        time: '09:00',
        currentTime: false,
        timeFormat: 'YYYY-MM-DD HH:mm:ss',
        timeZone: 'UTC',
      },
    });
    const result = await nextDayofWeek.run(ctx);
    // Should be next Saturday, not today
    expect(result).toEqual({ result: '2024-06-22 09:00:00' });
  });

  test('gets next Sunday', async () => {
    const ctx = createMockActionContext({
      propsValue: {
        weekday: 0, // Sunday
        time: '00:00',
        currentTime: false,
        timeFormat: 'YYYY-MM-DD HH:mm:ss',
        timeZone: 'UTC',
      },
    });
    const result = await nextDayofWeek.run(ctx);
    expect(result).toEqual({ result: '2024-06-16 00:00:00' });
  });
});
