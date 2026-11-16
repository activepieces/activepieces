import dayjs from 'dayjs';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { selfServeTrialCopy } from '@/features/billing/utils/self-serve-trial-utils';

import { icuI18n } from '../../../i18n/icu-i18n';

const NOW = new Date(2026, 9, 23, 9, 0, 0);

function endsInDays(days: number): string {
  return dayjs(NOW).add(days, 'day').hour(12).minute(0).toISOString();
}

beforeAll(async () => {
  await icuI18n.init();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('days left countdown', () => {
  it.each([
    { name: 'days away', days: 3, expected: '3 days left' },
    { name: 'the day before', days: 1, expected: '1 day left' },
    { name: 'the last day', days: 0, expected: 'last day' },
  ])('reads $expected when it is $name', ({ days, expected }) => {
    vi.useFakeTimers({ now: NOW });
    expect(selfServeTrialCopy.daysLeftCopy(endsInDays(days))).toBe(expected);
  });
});

describe('trial end summary', () => {
  it.each([
    {
      name: 'later',
      days: 3,
      expected:
        'Every Enterprise plan feature is on until Oct 26. Your credits are not affected.',
    },
    {
      name: 'tomorrow',
      days: 1,
      expected:
        'Every Enterprise plan feature is on until tomorrow at 12:00 PM. Your credits are not affected.',
    },
    {
      name: 'today',
      days: 0,
      expected:
        'Every Enterprise plan feature is on until today at 12:00 PM. Your credits are not affected.',
    },
  ])('names the end when it is $name', ({ days, expected }) => {
    vi.useFakeTimers({ now: NOW });
    expect(selfServeTrialCopy.trialEndSummary(endsInDays(days))).toBe(expected);
  });
});
