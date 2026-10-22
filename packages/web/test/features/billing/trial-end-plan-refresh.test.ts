import { describe, expect, it } from 'vitest';

import { trialEndPlanRefresh } from '@/features/billing/utils/trial-end-plan-refresh';

const NOW = Date.parse('2026-10-21T12:00:00.000Z');

describe('trialEndPlanRefresh.shouldRefreshPlan', () => {
  it('refreshes on the first day after the trial ended', () => {
    expect(
      trialEndPlanRefresh.shouldRefreshPlan({
        trialState: 'ended',
        trialEndsAt: '2026-10-21T09:00:00.000Z',
        now: NOW,
      }),
    ).toBe(true);
  });

  it('does not refresh once the trial ended more than a day ago', () => {
    expect(
      trialEndPlanRefresh.shouldRefreshPlan({
        trialState: 'ended',
        trialEndsAt: '2026-10-19T09:00:00.000Z',
        now: NOW,
      }),
    ).toBe(false);
  });

  it('does not refresh during the trial or without its dates', () => {
    expect(
      trialEndPlanRefresh.shouldRefreshPlan({
        trialState: 'active',
        trialEndsAt: '2026-10-21T09:00:00.000Z',
        now: NOW,
      }),
    ).toBe(false);
    expect(
      trialEndPlanRefresh.shouldRefreshPlan({
        trialState: 'ended',
        trialEndsAt: null,
        now: NOW,
      }),
    ).toBe(false);
  });
});
