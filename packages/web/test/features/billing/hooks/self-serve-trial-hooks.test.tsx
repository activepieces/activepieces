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
import { ActionWhenLocked, selfServeTrialHooks, SelfServeTrial, useActionWhenLocked, useLockedFeature } from '@/features/billing/hooks/self-serve-trial-hooks';
import { billingDialogHooks } from '@/features/billing/hooks/billing-dialog-hooks';

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


const trialDialogPayload = () =>
  billingDialogHooks.useSelfServeTrialDialogStore.getState().payload;

const plansDialogOpen = () =>
  billingDialogHooks.useManagePlanDialogStore.getState().isOpen;




let isPlatformAdmin = true;
let planTrialEndsAt: string | null = null;
let status: SelfServeTrialStatus;
const startSelfServeTrial = vi.fn();

vi.mock('@/hooks/authorization-hooks', () => ({
  useIsPlatformAdmin: () => isPlatformAdmin,
}));

vi.mock('@/components/providers/embed-provider', () => ({
  useEmbedding: () => ({ embedState: { isEmbedded: false } }),
}));

vi.mock('@/hooks/platform-hooks', () => ({
  platformHooks: {
    useCurrentPlatform: () => ({
      platform: {
        id: 'platform-1',
        plan: {
          plan: 'free',
        },
        selfServeTrial:
          planTrialEndsAt === null
            ? undefined
            : {
                startedAt: '2026-10-14T09:00:00.000Z',
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

const readTrial = (wrapper = queryWrapper()) =>
  renderHook(() => selfServeTrialHooks.useTrial(), { wrapper });

beforeEach(() => {
  isPlatformAdmin = true;
  planTrialEndsAt = null;
  status = activeStatus(dayjs().add(3, 'day').toDate());
});

describe('useTrial', () => {
  it('reports a trial whose end has passed as ended', async () => {
    status = activeStatus(dayjs().subtract(1, 'hour').toDate());
    const { result } = readTrial();
    await waitFor(() => expect(result.current.state).toBe(SelfServeTrialState.ENDED));
  });
});

describe('trial clock', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('refetches the platform once at the trial end however many components read the trial', async () => {
    vi.useFakeTimers();
    isPlatformAdmin = false;
    planTrialEndsAt = new Date(Date.now() + 60 * 1000).toISOString();
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const invalidate = vi.spyOn(client, 'invalidateQueries');
    const shared = queryWrapper(client);
    const readers = Array.from({ length: 25 }, () => readTrial(shared));
    expect(
      readers.every((reader) => reader.result.current.state === SelfServeTrialState.ACTIVE),
    ).toBe(true);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2 * 60 * 1000);
    });

    const platformRefetches = invalidate.mock.calls.filter(
      ([filters]) =>
        JSON.stringify(filters?.queryKey) === JSON.stringify(['platform']),
    );
    expect(platformRefetches).toHaveLength(1);
    expect(
      readers.every((reader) => reader.result.current.state !== SelfServeTrialState.ACTIVE),
    ).toBe(true);
    readers.forEach((reader) => reader.unmount());
  });
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
    vi.spyOn(selfServeTrialHooks, 'useTrial').mockImplementation(
      () =>
        ({
          state: state.trialState,
          isPlatformAdmin: state.isPlatformAdmin,
        }) as SelfServeTrial,
    );
    vi.spyOn(selfServeTrialHooks, 'useShouldOfferTrial').mockImplementation(
      () => state.offer,
    );
    state.trialState = 'none';
    state.offer = false;
    state.isPlatformAdmin = true;
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
      { isPlatformAdmin: false, actionWhenLocked: ActionWhenLocked.ASK_ADMIN },
      { offer: true, actionWhenLocked: ActionWhenLocked.START_TRIAL },
      { trialState: 'ended', actionWhenLocked: ActionWhenLocked.UPGRADE_AFTER_TRIAL },
      { trialState: 'used', actionWhenLocked: ActionWhenLocked.UPGRADE },
      { actionWhenLocked: ActionWhenLocked.UPGRADE },
    ])('is $actionWhenLocked for %j', ({ actionWhenLocked, ...setup }) => {
      Object.assign(state, setup);
      const { result } = renderHook(() => useActionWhenLocked());
      expect(result.current).toBe(actionWhenLocked);
    });
  });

  describe('clicking a locked feature', () => {
    it.each([
      { unlocked: true, click: 'ran' },
      { edition: ApEdition.COMMUNITY, click: 'guide' },
      { trialState: 'ended', click: 'plans' },
      { trialState: 'used', click: 'trial with callback' },
      { offer: true, click: 'trial with callback' },
    ])('opens $click for %j', ({ click, unlocked = false, ...setup }) => {
      Object.assign(state, setup);
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
