import { describe, expect, it } from 'vitest';

import { impactRunsUtils } from '@/app/routes/impact/lib/impact-runs-utils';

describe('impactRunsUtils.sumRunsByFlow', () => {
  it('sums runs across every daily bucket of a flow', () => {
    const totals = impactRunsUtils.sumRunsByFlow([
      { flowId: 'a', day: '2026-07-01', runs: 10 },
      { flowId: 'a', day: '2026-07-02', runs: 20 },
      { flowId: 'a', day: '2026-07-03', runs: 30 },
      { flowId: 'b', day: '2026-07-01', runs: 5 },
    ]);

    expect(totals.get('a')).toBe(60);
    expect(totals.get('b')).toBe(5);
  });

  it('returns an empty map when there are no runs', () => {
    expect(impactRunsUtils.sumRunsByFlow([]).size).toBe(0);
  });
});
