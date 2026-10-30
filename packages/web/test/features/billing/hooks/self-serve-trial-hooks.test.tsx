/**
 * @vitest-environment jsdom
 */
import { ApEdition, SelfServeTrialState, SelfServeTrialStatus } from '@activepieces/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import dayjs from 'dayjs';
import * as React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PLATFORM_BILLING_SUBSCRIPTION_KEY } from '@/features/billing/hooks/billing-hooks';
import { ActionWhenLocked, selfServeTrialHooks, useActionWhenLocked, useLockedFeature } from '@/features/billing/hooks/self-serve-trial-hooks';
import { billingDialogHooks } from '@/features/billing/hooks/billing-dialog-hooks';

const state = vi.hoisted(() => ({
  trialEnded: false,
  offer: false,
  edition: 'cloud',
  openWindow: vi.fn(),
}));

vi.mock('i18next', () => ({ t: (key: string) => key }));

vi.mock('@/hooks/flags-hooks', () => ({
  flagsHooks: { useFlag: () => ({ data: state.edition }) },
}));


const trialDialogPayload = () =>
  billingDialogHooks.useSelfServeTrialDialogStore.getState().payload;

const plansDialogOpen = () =>
  billingDialogHooks.useManagePlanDialogStore.getState().isOpen;




let isPlatformAdmin = true;
let isEmbedded = false;
let planTrialEndsAt: string | null = null;
let usersLimit: number | null = 5;
let status: SelfServeTrialStatus;
const startSelfServeTrial = vi.fn();

vi.mock('@/hooks/authorization-hooks', () => ({
  useIsPlatformAdmin: () => isPlatformAdmin,
}));

vi.mock('@/components/providers/embed-provider', () => ({
  useEmbedding: () => ({ embedState: { isEmbedded } }),
}));

vi.mock('@/hooks/platform-hooks', () => ({
  platformHooks: {
    useCurrentPlatform: () => ({
      platform: {
        id: 'platform-1',
        plan: {
          plan: 'free',
          usersLimit,
        },
        selfServeTrial:
          planTrialEndsAt === null
            ? undefined
            : {
                startedAt: '2026-10-07T09:00:00.000Z',
                endsAt: planTrialEndsAt,
              },
      },
    }),
  },
}));

vi.mock('@/features/billing/api/billing-plans-api', () => ({
  platformBillingApi: {
    getSubscriptionInfo: async () => ({ selfServeTrial: status }),
    startSelfServeTrial: () => startSelfServeTrial(),
  },
}));

const activeStatus = (endsAt: Date): SelfServeTrialStatus => ({
  state: SelfServeTrialState.ACTIVE,
  startedAt: dayjs(endsAt).subtract(7, 'day').toISOString(),
  endsAt: endsAt.toISOString(),
});

function queryWrapper(
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } }),
) {
  return function QueryWrapper({ children }: React.PropsWithChildren) {
    return (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
  };
}

beforeEach(() => {
  isPlatformAdmin = true;
  isEmbedded = false;
  planTrialEndsAt = null;
  usersLimit = 5;
  status = activeStatus(dayjs().add(3, 'day').toDate());
});

describe('starting the trial fails', () => {
  it('re-reads the real trial state', async () => {
    startSelfServeTrial.mockRejectedValueOnce(new Error('network lost'));
    const client = new QueryClient();
    const invalidate = vi.spyOn(client, 'invalidateQueries');
    const { result } = renderHook(() => selfServeTrialHooks.useStartSelfServeTrial(), {
      wrapper: queryWrapper(client),
    });

    await act(async () => {
      result.current.mutate();
    });
    await waitFor(() => expect(result.current.isError).toBe(true));

    const keys = invalidate.mock.calls.map(([filters]) =>
      JSON.stringify(filters?.queryKey),
    );
    expect(keys).toContain(JSON.stringify(PLATFORM_BILLING_SUBSCRIPTION_KEY));
    expect(keys).toContain(JSON.stringify(['platform']));
  });
});

describe('enterprise lockedFeature', () => {
  beforeEach(() => {
    vi.spyOn(selfServeTrialHooks, 'useShouldOfferTrial').mockImplementation(
      () => state.offer,
    );
    state.trialEnded = false;
    state.offer = false;
    state.edition = ApEdition.CLOUD;
    billingDialogHooks.useSelfServeTrialDialogStore.getState().closeDialog();
    billingDialogHooks.useManagePlanDialogStore.getState().closeDialog();
    state.openWindow.mockClear();
    vi.stubGlobal('open', state.openWindow);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('action when a feature is locked', () => {
    it.each([
      { edition: ApEdition.COMMUNITY, actionWhenLocked: ActionWhenLocked.SWITCH_EDITION },
      { member: true, actionWhenLocked: ActionWhenLocked.ASK_ADMIN },
      { embedded: true, actionWhenLocked: ActionWhenLocked.ASK_ADMIN },
      { offer: true, actionWhenLocked: ActionWhenLocked.START_TRIAL },
      { trialEnded: true, actionWhenLocked: ActionWhenLocked.UPGRADE_AFTER_TRIAL },
      { actionWhenLocked: ActionWhenLocked.UPGRADE },
    ])('is $actionWhenLocked for %j', ({ actionWhenLocked, member = false, embedded = false, ...setup }) => {
      Object.assign(state, setup);
      isPlatformAdmin = !member;
      isEmbedded = embedded;
      planTrialEndsAt = state.trialEnded ? dayjs().subtract(1, 'day').toISOString() : null;
      const { result } = renderHook(() => useActionWhenLocked());
      expect(result.current).toBe(actionWhenLocked);
    });
  });

  describe('clicking a locked feature', () => {
    it.each([
      { unlocked: true, click: 'ran' },
      { edition: ApEdition.COMMUNITY, click: 'guide' },
      { trialEnded: true, click: 'plans' },
      { click: 'trial with callback' },
      { offer: true, click: 'trial with callback' },
    ])('opens $click for %j', ({ click, unlocked = false, ...setup }) => {
      Object.assign(state, setup);
      planTrialEndsAt = state.trialEnded ? dayjs().subtract(1, 'day').toISOString() : null;
      const action = vi.fn();
      const lockedFeature = renderHook(() =>
        useLockedFeature({ unlocked, featureKey: 'AUDIT_LOGS' }),
      ).result;
      act(() =>
        lockedFeature.current.runOrShowLockedDialog(action),
      );
      const payload = trialDialogPayload();
      const outcomes = [
        action.mock.calls.length > 0 && 'ran',
        state.openWindow.mock.calls.length > 0 && 'guide',
        plansDialogOpen() && 'plans',
        payload?.featureKey === 'AUDIT_LOGS' &&
          (payload.postTrialActivationCallback ? 'trial with callback' : 'trial'),
      ];
      expect(outcomes.filter((outcome) => outcome !== false)).toEqual([click]);
    });
  });
});
