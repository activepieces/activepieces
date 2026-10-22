import { describe, expect, it } from 'vitest';

import { trialSeatEnforcement } from '@/features/billing/utils/trial-seat-enforcement';

const NOW = Date.parse('2026-10-21T12:00:00.000Z');

describe('trialSeatEnforcement.needsPlanRefresh', () => {
  it('refreshes on the first day after the trial ended', () => {
    expect(
      trialSeatEnforcement.needsPlanRefresh({
        trialState: 'ended',
        trialEndsAt: '2026-10-21T09:00:00.000Z',
        now: NOW,
      }),
    ).toBe(true);
  });

  it('does not refresh once the trial ended more than a day ago', () => {
    expect(
      trialSeatEnforcement.needsPlanRefresh({
        trialState: 'ended',
        trialEndsAt: '2026-10-19T09:00:00.000Z',
        now: NOW,
      }),
    ).toBe(false);
  });

  it('does not refresh during the trial or without its dates', () => {
    expect(
      trialSeatEnforcement.needsPlanRefresh({
        trialState: 'active',
        trialEndsAt: '2026-10-21T09:00:00.000Z',
        now: NOW,
      }),
    ).toBe(false);
    expect(
      trialSeatEnforcement.needsPlanRefresh({
        trialState: 'ended',
        trialEndsAt: null,
        now: NOW,
      }),
    ).toBe(false);
  });
});
