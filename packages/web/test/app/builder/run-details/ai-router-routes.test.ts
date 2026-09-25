import { describe, expect, it } from 'vitest';

import { aiRouterRoutesUtils } from '@/app/builder/run-details/ai-router-routes';

const { rankRoutes, floorExplanation } = aiRouterRoutesUtils;

function branch(branchName: string, evaluation: boolean) {
  return { branchName, branchIndex: 0, evaluation };
}

describe('rankRoutes', () => {
  it('sorts routes by probability and marks the one that ran', () => {
    const ranked = rankRoutes({
      branches: [
        branch('Billing', true),
        branch('Technical', false),
        branch('Sales', false),
      ],
      choice: 'Billing',
      probabilities: { Sales: 0.03, Billing: 0.91, Technical: 0.06 },
    });

    expect(ranked).toEqual([
      { name: 'Billing', percent: 91, chosen: true },
      { name: 'Technical', percent: 6, chosen: false },
      { name: 'Sales', percent: 3, chosen: false },
    ]);
  });

  it('marks what ran, not what the model answered', () => {
    const ranked = rankRoutes({
      branches: [branch('Billing', false), branch('Otherwise', true)],
      choice: 'Billing',
      probabilities: { Billing: 0.4, Otherwise: 0.6 },
    });

    expect(ranked?.find((route) => route.chosen)?.name).toBe('Otherwise');
    expect(ranked?.find((route) => route.name === 'Billing')?.chosen).toBe(
      false,
    );
  });

  it('marks every route that ran when several did', () => {
    const ranked = rankRoutes({
      branches: [
        branch('Billing', true),
        branch('Sales', true),
        branch('Technical', false),
      ],
      probabilities: { Billing: 0.9, Sales: 0.7, Technical: 0.05 },
    });

    expect(ranked?.filter((route) => route.chosen).map((r) => r.name)).toEqual([
      'Billing',
      'Sales',
    ]);
  });

  it('shows an unscored route that ran, and sorts it last', () => {
    const ranked = rankRoutes({
      branches: [branch('Billing', false), branch('Otherwise', true)],
      probabilities: { Billing: 0.2 },
    });

    expect(ranked).toEqual([
      { name: 'Billing', percent: 20, chosen: false },
      { name: 'Otherwise', percent: undefined, chosen: true },
    ]);
  });

  it('returns nothing when no route carries a usable probability', () => {
    const branches = [branch('Billing', true)];
    expect(rankRoutes({ branches })).toBeUndefined();
    expect(rankRoutes({ branches, probabilities: {} })).toBeUndefined();
    expect(
      rankRoutes({ branches, probabilities: { Billing: 'high' } }),
    ).toBeUndefined();
  });

  it('returns nothing for an output that is not an ai router result', () => {
    expect(rankRoutes(undefined)).toBeUndefined();
    expect(rankRoutes('No output')).toBeUndefined();
    expect(rankRoutes({ choice: 'Billing' })).toBeUndefined();
  });

  it('ignores a non numeric probability rather than rendering NaN', () => {
    const ranked = rankRoutes({
      branches: [branch('Billing', true), branch('Broken', false)],
      probabilities: { Billing: 1, Broken: 'high' },
    });

    expect(ranked).toEqual([
      { name: 'Billing', percent: 100, chosen: true },
      { name: 'Broken', percent: undefined, chosen: false },
    ]);
  });
});

describe('floorExplanation', () => {
  const ranked = [
    { name: 'Route 1', percent: 63, chosen: false },
    { name: 'Route 2', percent: 33, chosen: false },
    { name: 'Otherwise', percent: 4, chosen: true },
  ];

  it('explains why the fallback ran when the top route is under the floor', () => {
    expect(floorExplanation({ input: { minConfidence: 0.9 }, ranked })).toEqual(
      {
        route: 'Route 1',
        percent: 63,
        floor: 90,
        fallback: 'Otherwise',
      },
    );
  });

  it('says nothing without a floor, in all-matches mode, or when the top route ran', () => {
    expect(floorExplanation({ input: {}, ranked })).toBeUndefined();
    expect(
      floorExplanation({
        input: { minConfidence: 0.9, matchMode: 'ALL_MATCHES' },
        ranked,
      }),
    ).toBeUndefined();
    expect(
      floorExplanation({
        input: { minConfidence: 0.5 },
        ranked: [
          { name: 'Route 1', percent: 63, chosen: true },
          { name: 'Otherwise', percent: 4, chosen: false },
        ],
      }),
    ).toBeUndefined();
  });
});
