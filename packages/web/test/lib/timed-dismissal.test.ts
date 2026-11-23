import dayjs from 'dayjs';
import { describe, expect, it } from 'vitest';

import { timedDismissal } from '@/lib/timed-dismissal';

describe('timedDismissal', () => {
  it('stays hidden for the configured duration and comes back after it', () => {
    const weekLong = timedDismissal.create({
      storageKeyPrefix: 'test-dismissal',
      durationHours: 7 * 24,
    });

    expect(
      weekLong.isActive({
        dismissedAt: dayjs().subtract(6, 'day').toISOString(),
      }),
    ).toBe(true);
    expect(
      weekLong.isActive({
        dismissedAt: dayjs().subtract(7, 'day').toISOString(),
      }),
    ).toBe(false);
  });
});
