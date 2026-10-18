import dayjs from 'dayjs';
import { describe, expect, it } from 'vitest';

import { enterpriseTrialTime } from '@/features/billing/utils/enterprise-trial-time';

const NOW = new Date(2026, 9, 12, 10, 0, 0);
const LATE = new Date(2026, 9, 12, 23, 30, 0);

describe('active trial timing', () => {
  it.each([
    {
      name: 'mid-trial',
      now: NOW,
      startedAt: dayjs(NOW).subtract(3, 'day').toDate(),
      endsAt: dayjs(NOW).add(4, 'day').toDate(),
      expected: { daysLeft: 4, ending: false, justStarted: false },
    },
    {
      name: 'ends tomorrow evening',
      now: NOW,
      startedAt: dayjs(NOW).subtract(6, 'day').toDate(),
      endsAt: dayjs(NOW).add(1, 'day').hour(18).toDate(),
      expected: { daysLeft: 1, ending: true, endsToday: false },
    },
    {
      name: 'ends tonight',
      now: NOW,
      startedAt: dayjs(NOW).subtract(7, 'day').toDate(),
      endsAt: dayjs(NOW).hour(23).minute(50).toDate(),
      expected: { daysLeft: 0, ending: true, endsToday: true },
    },
    {
      name: 'ends just after midnight',
      now: LATE,
      startedAt: dayjs(LATE).subtract(6, 'day').toDate(),
      endsAt: dayjs(LATE).add(1, 'hour').toDate(),
      expected: { daysLeft: 1, ending: true, endsToday: false },
    },
    {
      name: 'started yesterday',
      now: NOW,
      startedAt: dayjs(NOW).subtract(1, 'day').toDate(),
      endsAt: dayjs(NOW).add(6, 'day').toDate(),
      expected: { daysLeft: 6, justStarted: true },
    },
  ])('$name', ({ now, startedAt, endsAt, expected }) => {
    expect(
      enterpriseTrialTime.activeTrialTiming({
        startedAt,
        endsAt,
        now: now.getTime(),
      }),
    ).toMatchObject(expected);
  });
});

describe('next clock boundary', () => {
  it.each([
    {
      name: 'the midnight before the end',
      end: dayjs(NOW).add(2, 'day').hour(18).valueOf(),
      expected: dayjs(NOW).add(1, 'day').startOf('day').valueOf(),
    },
    {
      name: 'the end itself when it comes before midnight',
      end: dayjs(NOW).hour(18).valueOf(),
      expected: dayjs(NOW).hour(18).valueOf(),
    },
  ])('$name', ({ end, expected }) => {
    expect(enterpriseTrialTime.nextBoundary({ end, now: NOW.getTime() })).toBe(
      expected,
    );
  });
});
