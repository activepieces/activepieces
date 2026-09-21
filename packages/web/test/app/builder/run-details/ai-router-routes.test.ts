import { describe, expect, it } from 'vitest';

import { aiRouterRoutesUtils } from '@/app/builder/run-details/ai-router-routes';

const { rankRoutes } = aiRouterRoutesUtils;

describe('rankRoutes', () => {
  it('sorts routes by probability and marks the chosen one', () => {
    const ranked = rankRoutes({
      choice: 'Billing',
      probabilities: { Sales: 0.03, Billing: 0.91, Technical: 0.06 },
    });

    expect(ranked).toEqual([
      { name: 'Billing', percent: 91, chosen: true },
      { name: 'Technical', percent: 6, chosen: false },
      { name: 'Sales', percent: 3, chosen: false },
    ]);
  });

  it('marks the chosen route even when another scored higher', () => {
    const ranked = rankRoutes({
      choice: 'Otherwise',
      probabilities: { Technical: 0.38, Otherwise: 0.55 },
    });

    expect(ranked?.[0]).toEqual({
      name: 'Otherwise',
      percent: 55,
      chosen: true,
    });
  });

  it('returns nothing when the model gave no distribution', () => {
    expect(rankRoutes({ choice: 'Billing' })).toBeUndefined();
    expect(
      rankRoutes({ choice: 'Billing', probabilities: {} }),
    ).toBeUndefined();
  });

  it('returns nothing for an output that is not an ai router result', () => {
    expect(rankRoutes(undefined)).toBeUndefined();
    expect(rankRoutes('No output')).toBeUndefined();
    expect(rankRoutes({ branches: [] })).toBeUndefined();
  });

  it('ignores non numeric probabilities rather than rendering NaN', () => {
    const ranked = rankRoutes({
      choice: 'Billing',
      probabilities: { Billing: 1, Broken: 'high' },
    });

    expect(ranked).toEqual([{ name: 'Billing', percent: 100, chosen: true }]);
  });
});
