import { describe, expect, it } from 'vitest';

import { trialSeatEnforcement } from '@/features/billing/utils/trial-seat-enforcement';

describe('trialSeatEnforcement.shouldEnforce', () => {
  it('enforces once the trial has ended and the platform is over its seats', () => {
    expect(
      trialSeatEnforcement.shouldEnforce({
        trialState: 'ended',
        usedSeats: 6,
        seatLimit: 1,
        managePlanOpen: false,
      }),
    ).toBe(true);
  });

  it('leaves a platform alone while the trial is still running', () => {
    expect(
      trialSeatEnforcement.shouldEnforce({
        trialState: 'active',
        usedSeats: 6,
        seatLimit: 1,
        managePlanOpen: false,
      }),
    ).toBe(false);
  });

  it('leaves a platform alone once it fits its seats', () => {
    expect(
      trialSeatEnforcement.shouldEnforce({
        trialState: 'ended',
        usedSeats: 1,
        seatLimit: 1,
        managePlanOpen: false,
      }),
    ).toBe(false);
  });

  it('leaves a platform with unlimited seats alone', () => {
    expect(
      trialSeatEnforcement.shouldEnforce({
        trialState: 'ended',
        usedSeats: 40,
        seatLimit: null,
        managePlanOpen: false,
      }),
    ).toBe(false);
  });

  it('steps aside while the admin is choosing a plan', () => {
    expect(
      trialSeatEnforcement.shouldEnforce({
        trialState: 'ended',
        usedSeats: 6,
        seatLimit: 1,
        managePlanOpen: true,
      }),
    ).toBe(false);
  });
});

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
