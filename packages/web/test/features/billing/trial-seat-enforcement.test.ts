import { describe, expect, it } from 'vitest';

import { trialSeatEnforcement } from '@/features/billing/utils/trial-seat-enforcement';

describe('trialSeatEnforcement.needsPlanRefresh', () => {
  it('refreshes when the trial ended but the plan still carries its dates', () => {
    expect(
      trialSeatEnforcement.needsPlanRefresh({
        trialState: 'ended',
        planTrialEndsAt: '2026-10-13T16:51:01.835Z',
      }),
    ).toBe(true);
  });

  it('does not refresh once the plan no longer carries the trial', () => {
    expect(
      trialSeatEnforcement.needsPlanRefresh({
        trialState: 'ended',
        planTrialEndsAt: null,
      }),
    ).toBe(false);
  });

  it('does not refresh during the trial', () => {
    expect(
      trialSeatEnforcement.needsPlanRefresh({
        trialState: 'active',
        planTrialEndsAt: '2026-10-13T16:51:01.835Z',
      }),
    ).toBe(false);
  });
});
