import { describe, expect, it } from 'vitest';

import { triggerHealthUtils } from '@/app/routes/platform/infra/triggers/trigger-health-utils';

describe('triggerHealthUtils.successRate', () => {
  it('is 100 when there were no runs', () => {
    expect(
      triggerHealthUtils.successRate({ successRuns: 0, failureRuns: 0 }),
    ).toBe(100);
  });

  it('is 0 when every run failed', () => {
    expect(
      triggerHealthUtils.successRate({ successRuns: 0, failureRuns: 12 }),
    ).toBe(0);
  });

  it('rounds to one decimal', () => {
    expect(
      triggerHealthUtils.successRate({ successRuns: 2, failureRuns: 1 }),
    ).toBe(66.7);
  });
});

describe('triggerHealthUtils.compareWorstFirst', () => {
  const row = (id: string, status: string, last24Hours: number) => ({
    id,
    status,
    last24Hours,
    last7Days: last24Hours,
    last14Days: last24Hours,
  });

  it('puts failing triggers first, then warnings, then healthy ones', () => {
    const rows = [
      row('healthy', 'success', 100),
      row('warning', 'warning', 40),
      row('failing', 'fault', 90),
    ];
    expect(
      [...rows].sort(triggerHealthUtils.compareWorstFirst).map((r) => r.id),
    ).toEqual(['failing', 'warning', 'healthy']);
  });

  it('orders the same status by the lowest success rate', () => {
    const rows = [row('b', 'warning', 80), row('a', 'warning', 20)];
    expect(
      [...rows].sort(triggerHealthUtils.compareWorstFirst).map((r) => r.id),
    ).toEqual(['a', 'b']);
  });
});
