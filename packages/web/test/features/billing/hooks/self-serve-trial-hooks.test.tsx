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
import { selfServeTrialHooks, SelfServeTrial, useEnterpriseAccess, useEnterpriseGate } from '@/features/billing/hooks/self-serve-trial-hooks';
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
    const { result } = renderHook(() => selfServeTrialHooks.useStart(), {
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

describe('enterprise gate', () => {
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
      act(() => gate.current.runOrShowLockedDialog(action, { resumable }));
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
});
