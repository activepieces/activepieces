/**
 * @vitest-environment jsdom
 */
import { ApEdition } from '@activepieces/shared';
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { billingDialogHooks } from '@/features/billing/hooks/billing-dialog-hooks';
import {
  useEnterpriseAccess,
  useEnterpriseGate,
} from '@/features/billing/hooks/use-enterprise-gate';

const state = vi.hoisted(() => ({
  trialState: 'none',
  offer: false,
  isPlatformAdmin: true,
  edition: 'cloud',
  openWindow: vi.fn(),
}));

vi.mock('i18next', () => ({ t: (key: string) => key }));

vi.mock('@/hooks/flags-hooks', () => ({
  flagsHooks: { useFlag: () => ({ data: state.edition }) },
}));

vi.mock('@/features/billing/hooks/enterprise-trial-hooks', () => ({
  enterpriseTrialHooks: {
    useTrial: () => ({
      state: state.trialState,
      isPlatformAdmin: state.isPlatformAdmin,
    }),
    useOffer: () => state.offer,
  },
}));

const trialDialogPayload = () =>
  billingDialogHooks.useEnterpriseTrialDialogStore.getState().payload;

const plansDialogOpen = () =>
  billingDialogHooks.useManagePlanDialogStore.getState().isOpen;

beforeEach(() => {
  state.trialState = 'none';
  state.offer = false;
  state.isPlatformAdmin = true;
  state.edition = ApEdition.CLOUD;
  billingDialogHooks.useEnterpriseTrialDialogStore.getState().closeDialog();
  billingDialogHooks.useManagePlanDialogStore.getState().closeDialog();
  state.openWindow.mockClear();
  vi.stubGlobal('open', state.openWindow);
});

describe('enterprise access', () => {
  it.each([
    { unlocked: true, trialState: 'active', access: 'trialing' },
    { unlocked: true, access: 'entitled' },
    { edition: ApEdition.COMMUNITY, access: 'community' },
    { isPlatformAdmin: false, access: 'ask_admin' },
    { offer: true, access: 'trial_available' },
    { trialState: 'ended', access: 'trial_used' },
    { trialState: 'used', access: 'upgrade' },
    { access: 'upgrade' },
  ])('is $access for %j', ({ access, unlocked = false, ...setup }) => {
    Object.assign(state, setup);
    const { result } = renderHook(() => useEnterpriseAccess({ unlocked }));
    expect(result.current).toBe(access);
  });
});

describe('clicking a locked feature', () => {
  it.each([
    { unlocked: true, click: 'ran' },
    { edition: ApEdition.COMMUNITY, click: 'guide' },
    { trialState: 'ended', click: 'plans' },
    { trialState: 'used', click: 'trial with resume' },
    { offer: true, click: 'trial with resume' },
    { offer: true, resumable: false, click: 'trial' },
  ])('opens $click for %j', ({ click, unlocked = false, ...setup }) => {
    const { resumable, ...trial } = setup;
    Object.assign(state, trial);
    const action = vi.fn();
    const gate = renderHook(() =>
      useEnterpriseGate({ unlocked, featureKey: 'AUDIT_LOGS' }),
    ).result;
    act(() => gate.current.run(action, { resumable }));
    const payload = trialDialogPayload();
    const outcomes = [
      action.mock.calls.length > 0 && 'ran',
      state.openWindow.mock.calls.length > 0 && 'guide',
      plansDialogOpen() && 'plans',
      payload?.featureKey === 'AUDIT_LOGS' &&
        (payload.resume ? 'trial with resume' : 'trial'),
    ];
    expect(outcomes.filter((outcome) => outcome !== false)).toEqual([click]);
  });
});
