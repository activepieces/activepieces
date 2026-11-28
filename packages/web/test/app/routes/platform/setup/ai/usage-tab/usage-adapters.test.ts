/**
 * @vitest-environment jsdom
 */
import {
  AiUsageHistory,
  AiUsageRanges,
  AiUsageTotals,
} from '@activepieces/shared';
import { describe, expect, it, vi } from 'vitest';

import { usageAdapters } from '@/app/routes/platform/setup/ai/usage-tab/usage-adapters';

const HOUR_MS = 60 * 60 * 1000;

const totals = (spendUsd: number): AiUsageTotals => ({
  spendUsd,
  previousSpendUsd: 0,
  calls: 0,
  previousCalls: 0,
  tokens: 0,
  previousTokens: 0,
  cacheShare: 0,
  managedCredits: 0,
});

const history = (currentCoverage: number): AiUsageHistory => ({
  trackingSince: null,
  hasAnyUsage: true,
  coveredDays: 1,
  periodDays: 7,
  currentCoverage,
  comparable: false,
});

const rangesEndingIn = (msFromNow: number): AiUsageRanges => ({
  current: {
    start: new Date(Date.now() - 7 * 24 * HOUR_MS).toISOString(),
    end: new Date(Date.now() + msFromNow).toISOString(),
  },
  previous: {
    start: new Date(0).toISOString(),
    end: new Date(0).toISOString(),
  },
});

describe('usageAdapters.paceOf', () => {
  it('never shows an average per day above the total when less than a day is tracked', () => {
    const pace = usageAdapters.paceOf({
      totals: totals(2.62),
      ranges: rangesEndingIn(HOUR_MS),
      history: history(15 / (7 * 24)),
      period: '7d',
    });
    expect(pace.avgPerDayUsd).toBeCloseTo(2.62);
  });

  it('still projects a full day for short periods', () => {
    const pace = usageAdapters.paceOf({
      totals: totals(1),
      ranges: {
        current: {
          start: new Date(Date.now() - 6 * HOUR_MS).toISOString(),
          end: new Date(Date.now()).toISOString(),
        },
        previous: {
          start: new Date(0).toISOString(),
          end: new Date(0).toISOString(),
        },
      },
      history: history(1),
      period: '6h',
    });
    expect(pace.avgPerDayUsd).toBeCloseTo(4);
  });

  it('forecasts the month from at least one day on the first day of the month', () => {
    vi.useFakeTimers({ now: new Date('2026-11-01T12:00:00Z') });
    const pace = usageAdapters.paceOf({
      totals: totals(3),
      ranges: {
        current: {
          start: '2026-11-01T00:00:00.000Z',
          end: '2026-12-01T00:00:00.000Z',
        },
        previous: {
          start: new Date(0).toISOString(),
          end: new Date(0).toISOString(),
        },
      },
      history: history(1),
      period: 'this-month',
    });
    vi.useRealTimers();
    expect(pace.avgPerDayUsd).toBeCloseTo(3);
    expect(pace.forecastUsd).toBeCloseTo(90);
  });
});

describe('usageAdapters.chartPointsOf', () => {
  const points = [
    { label: 'a', current: 3, previous: null },
    { label: 'b', current: 2, previous: null },
    { label: 'c', current: 0, previous: null },
  ];

  it('draws the unfinished last point as a separate live segment', () => {
    expect(
      usageAdapters.chartPointsOf({ points, ranges: rangesEndingIn(HOUR_MS) }),
    ).toEqual([
      { ...points[0], settled: 3, live: null },
      { ...points[1], settled: 2, live: 2 },
      { ...points[2], settled: null, live: 0 },
    ]);
  });

  it('keeps every point settled for a finished period', () => {
    expect(
      usageAdapters.chartPointsOf({ points, ranges: rangesEndingIn(-HOUR_MS) }),
    ).toEqual(
      points.map((point) => ({ ...point, settled: point.current, live: null })),
    );
  });
});
