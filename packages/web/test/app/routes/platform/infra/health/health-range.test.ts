import dayjs from 'dayjs';
import { describe, expect, it } from 'vitest';

import { healthRangeUtils } from '@/app/routes/platform/infra/health/lib/health-range';

describe('healthRangeUtils.monthRange', () => {
  it('ends the current month today, so the previous period has the same length', () => {
    const now = dayjs('2026-10-05T14:30:00').toDate();
    const range = healthRangeUtils.monthRange({ month: '2026-10', now });
    expect(range.createdAfter).toBe(
      dayjs('2026-10-01').startOf('day').toISOString(),
    );
    expect(range.createdBefore).toBe(dayjs(now).endOf('day').toISOString());
  });

  it('keeps the whole month for a past month', () => {
    const now = dayjs('2026-10-05T14:30:00').toDate();
    const range = healthRangeUtils.monthRange({ month: '2026-09', now });
    expect(range.createdAfter).toBe(
      dayjs('2026-09-01').startOf('day').toISOString(),
    );
    expect(range.createdBefore).toBe(
      dayjs('2026-09-30').endOf('day').toISOString(),
    );
  });

  it('gives the same range all day, so the server cache keeps hitting', () => {
    const morning = healthRangeUtils.monthRange({
      month: '2026-10',
      now: dayjs('2026-10-05T08:00:00').toDate(),
    });
    const evening = healthRangeUtils.monthRange({
      month: '2026-10',
      now: dayjs('2026-10-05T22:00:00').toDate(),
    });
    expect(evening).toEqual(morning);
  });
});
