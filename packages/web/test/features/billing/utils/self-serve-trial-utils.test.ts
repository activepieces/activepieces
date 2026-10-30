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

describe('trial running or ended', () => {
  it.each([
    { name: 'no trial', trial: undefined, running: false, ended: false },
    {
      name: 'a trial that ends later',
      trial: dayjs(NOW).add(2, 'day'),
      running: true,
      ended: false,
    },
    {
      name: 'a trial that ended',
      trial: dayjs(NOW).subtract(1, 'minute'),
      running: false,
      ended: true,
    },
  ])('$name', ({ trial, running, ended }) => {
    vi.useFakeTimers({ now: NOW });
    const dates = trial && {
      startedAt: dayjs(NOW).subtract(5, 'day').toISOString(),
      endsAt: trial.toISOString(),
    };
    expect(selfServeTrialTime.isRunning(dates)).toBe(running);
    expect(selfServeTrialTime.hasEnded(dates)).toBe(ended);
  });
});
