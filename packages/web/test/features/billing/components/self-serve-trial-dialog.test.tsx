/**
 * @vitest-environment jsdom
 */
import { ErrorCode } from '@activepieces/core-utils';
import { SelfServeTrialState } from '@activepieces/shared';
/* eslint-disable jest-dom/prefer-in-document -- @testing-library/jest-dom is not a dependency of packages/web */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen } from '@testing-library/react';
import * as React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SelfServeTrialDialog } from '@/features/billing/components/self-serve-trial-dialog';

let offer = false;
let payload: {
  featureKey?: string;
  postTrialActivationCallback?: () => Promise<unknown>;
} | null = null;
let startFailed = false;
let startError: unknown = null;
let liveStatus:
  | { state: string; startedAt: string | null; endsAt: string | null }
  | undefined;
let onStarted: ((status: { state: string }) => void) | undefined;
const mutate = vi.fn();

vi.mock('i18next', () => ({ t: (key: string) => key }));

vi.mock('canvas-confetti', () => ({
  default: Object.assign(vi.fn(), { reset: vi.fn() }),
}));

vi.mock('@/features/billing/hooks/billing-dialog-hooks', () => ({
  billingDialogHooks: {
    useSelfServeTrialDialogStore: () => ({
      payload,
      openDialog: vi.fn(),
      closeDialog: vi.fn(),
    }),
  },
}));

vi.mock('@/hooks/platform-hooks', () => ({
  platformHooks: {
    useCurrentPlatform: () => ({
      platform: {
        id: 'platform-1',
        plan: { plan: 'free', billedTeamProjectsLimit: 1 },
      },
    }),
  },
}));

vi.mock('@/features/billing/hooks/use-upgrade-click', () => ({
  useUpgradeClick: () => vi.fn(),
}));

vi.mock('@/features/billing/hooks/self-serve-trial-hooks', () => ({
  SELF_SERVE_TRIAL_DAYS: 7,
  selfServeTrialHooks: {
    useStatus: () => ({ data: liveStatus }),
    useShouldOfferTrial: () => offer,
    useStartSelfServeTrial: (
      callback?: (status: { state: string }) => void,
    ) => {
      onStarted = callback;
      return {
        data: undefined,
        isPending: false,
        isError: startFailed,
        error: startError,
        mutate,
        reset: vi.fn(),
      };
    },
    useTrial: () => ({
      state: 'none',
      startedAt: null,
      endsAt: null,
      isPlatformAdmin: true,
      basePlanName: 'Free',
    }),
  },
}));

vi.mock('@/features/billing/components/self-serve-trial-notices', () => ({
  SelfServeTrialEndedDialog: () => null,
}));

vi.mock('@/features/billing/components/current-subscription-card', () => ({
  SelfServeTrialSalesLink: () => null,
}));

const client = new QueryClient();

const dialog = () => (
  <QueryClientProvider client={client}>
    <MemoryRouter>
      <SelfServeTrialDialog />
    </MemoryRouter>
  </QueryClientProvider>
);

const startTrialAndSave = () =>
  fireEvent.click(screen.getByRole('button', { name: 'Start trial and save' }));

beforeEach(() => {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      disconnect() {}
    },
  );
  offer = true;
  payload = { featureKey: 'PROJECTS' };
  startFailed = false;
  startError = null;
  liveStatus = undefined;
  mutate.mockClear();
});

describe('the start dialog', () => {
  it('names the clicked feature in the title when the list shows it', () => {
    payload = { featureKey: 'SSO' };

    render(dialog());

    expect(
      screen.getByText('Try {feature} free for {days} days'),
    ).toBeDefined();
  });

  it('uses the plan title for a feature the list leaves out', () => {
    payload = { featureKey: 'SIGNING_KEYS' };

    render(dialog());

    expect(
      screen.getByText('Try the Enterprise plan free for {days} days'),
    ).toBeDefined();
  });
});

describe('starting the trial from a blocked change', () => {
  it('finishes the blocked change from the hook even if the dialog state was reset', async () => {
    const postTrialActivationCallback = vi.fn().mockResolvedValue(undefined);
    payload = { featureKey: 'PROJECTS', postTrialActivationCallback };
    render(dialog());
    startTrialAndSave();
    expect(mutate).toHaveBeenCalledTimes(1);
    payload = null;
    await act(async () => {
      onStarted?.({ state: SelfServeTrialState.ACTIVE });
      await new Promise((resolve) => setTimeout(resolve, 10));
    });
    expect(postTrialActivationCallback).toHaveBeenCalledTimes(1);
  });
});

describe('a start the console refuses as used', () => {
  it('shows that the trial was already used', () => {
    startFailed = true;
    startError = {
      isAxiosError: true,
      response: { data: { code: ErrorCode.SELF_SERVE_TRIAL_ALREADY_USED } },
    };

    render(dialog());

    expect(
      screen.getByText('Your Enterprise plan trial was already used'),
    ).toBeDefined();
  });

  it('keeps the start view with its error for any other failure', () => {
    startFailed = true;
    startError = { isAxiosError: true, response: { data: {} } };

    render(dialog());

    expect(
      screen.queryByText('Your Enterprise plan trial was already used'),
    ).toBeNull();
  });
});
