import dayjs from 'dayjs';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { selfServeTrialTime } from '@/features/billing/utils/self-serve-trial-utils';

const NOW = new Date(2026, 9, 12, 10, 0, 0);
const LATE = new Date(2026, 9, 12, 23, 30, 0);

afterEach(() => {
  vi.useRealTimers();
});

describe('days left in the trial', () => {
  it.each([
    {
      name: 'mid-trial',
      now: NOW,
      endsAt: dayjs(NOW).add(4, 'day'),
      expected: 4,
    },
    {
      name: 'ends tomorrow evening',
      now: NOW,
      endsAt: dayjs(NOW).add(1, 'day').hour(18),
      expected: 1,
    },
    {
      name: 'ends tonight',
      now: NOW,
      endsAt: dayjs(NOW).hour(23).minute(50),
      expected: 0,
    },
    {
      name: 'ends just after midnight',
      now: LATE,
      endsAt: dayjs(LATE).add(1, 'hour'),
      expected: 1,
    },
  ])('$name', ({ now, endsAt, expected }) => {
    vi.useFakeTimers({ now });
    expect(selfServeTrialTime.daysLeft(endsAt.toISOString())).toBe(expected);
  });
});
