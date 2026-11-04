import { describe, expect, it } from 'vitest';

import { triggerHealthUtils } from '@/app/routes/platform/infra/triggers/trigger-health-utils';

describe('triggerHealthUtils.successRate', () => {
  it('reports 0% when every run failed', () => {
    expect(
      triggerHealthUtils.successRate({ successRuns: 0, failureRuns: 12 }),
    ).toBe(0);
  });

  it('reports 100% when there were no runs', () => {
    expect(
      triggerHealthUtils.successRate({ successRuns: 0, failureRuns: 0 }),
    ).toBe(100);
  });
});

describe('triggerHealthUtils.compareWorstFirst', () => {
  it('puts failing triggers before warnings and healthy ones', () => {
    const row = (id: string, type: string, rate: number) => ({
      id,
      status: { type },
      last24Hours: rate,
      last7Days: rate,
      last14Days: rate,
    });
    const rows = [
      row('healthy', 'success', 100),
      row('warning', 'warning', 60),
      row('failing', 'fault', 0),
    ];
    expect(
      [...rows].sort(triggerHealthUtils.compareWorstFirst).map((r) => r.id),
    ).toEqual(['failing', 'warning', 'healthy']);
  });
});
