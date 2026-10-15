/**
 * @vitest-environment jsdom
 */
import { ApEdition, PlatformAdminSurface } from '@activepieces/shared';
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  trialState: 'ended',
  offer: false,
  capture: vi.fn(),
}));

vi.mock('i18next', () => ({ t: (key: string) => key }));

vi.mock('@/components/providers/telemetry-provider', () => ({
  useTelemetry: () => ({ capture: state.capture }),
}));

vi.mock('@/hooks/flags-hooks', () => ({
  flagsHooks: {
    useFlag: () => ({ data: ApEdition.CLOUD }),
  },
}));

vi.mock('@/features/billing/hooks/enterprise-trial-hooks', () => ({
  enterpriseTrialHooks: {
    useTrial: () => ({ state: state.trialState, isPlatformAdmin: true }),
    useOffer: () => state.offer,
  },
}));

import { billingDialogHooks } from '@/features/billing/hooks/billing-dialog-hooks';
import { useEnterpriseGate } from '@/features/billing/hooks/use-enterprise-gate';

beforeEach(() => {
  state.capture.mockClear();
  billingDialogHooks.useEnterpriseTrialDialogStore.getState().closeDialog();
  billingDialogHooks.useManagePlanDialogStore.getState().closeDialog();
});

describe('clicking a locked feature', () => {
  it('opens the plans dialog directly once the trial has ended', () => {
    state.trialState = 'ended';
    state.offer = false;
    const { result } = renderHook(() =>
      useEnterpriseGate({ unlocked: false, featureKey: 'AUDIT_LOGS' }),
    );

    act(() => result.current.run(() => undefined));

    expect(billingDialogHooks.useManagePlanDialogStore.getState().isOpen).toBe(
      true,
    );
    expect(
      billingDialogHooks.useEnterpriseTrialDialogStore.getState().payload,
    ).toBeNull();
    expect(state.capture).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          feature: 'AUDIT_LOGS',
          surface: PlatformAdminSurface.DIALOG,
        }),
      }),
    );
  });

  it('still opens the trial dialog while the trial can be started', () => {
    state.trialState = 'none';
    state.offer = true;
    const { result } = renderHook(() =>
      useEnterpriseGate({ unlocked: false, featureKey: 'AUDIT_LOGS' }),
    );

    act(() => result.current.explain());

    expect(
      billingDialogHooks.useEnterpriseTrialDialogStore.getState().payload
        ?.featureKey,
    ).toBe('AUDIT_LOGS');
    expect(billingDialogHooks.useManagePlanDialogStore.getState().isOpen).toBe(
      false,
    );
  });
});
