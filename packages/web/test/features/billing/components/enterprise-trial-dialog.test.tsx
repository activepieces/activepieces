/**
 * @vitest-environment jsdom
 */
/* eslint-disable jest-dom/prefer-in-document -- @testing-library/jest-dom is not a dependency of packages/web */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen } from '@testing-library/react';
import * as React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { EnterpriseTrialDialog } from '@/features/billing/components/enterprise-trial-dialog';

let offer = false;
let payload: { featureKey?: string; resume?: () => Promise<unknown> } | null =
  null;
let startFailed = false;
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
    useEnterpriseTrialDialogStore: () => ({
      payload,
      openDialog: vi.fn(),
      closeDialog: vi.fn(),
    }),
  },
}));

vi.mock('@/hooks/flags-hooks', () => ({
  flagsHooks: { useFlag: () => ({ data: 'cloud' }) },
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

vi.mock('@/features/billing/hooks/enterprise-trial-hooks', () => ({
  ENTERPRISE_TRIAL_DAYS: 7,
  enterpriseTrialHooks: {
    useStatus: () => ({ data: liveStatus }),
    useOffer: () => offer,
    useStart: (callback?: (status: { state: string }) => void) => {
      onStarted = callback;
      return {
        data: undefined,
        isPending: false,
        isError: startFailed,
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

vi.mock('@/features/billing/components/enterprise-trial-ended-dialog', () => ({
  EnterpriseTrialEndedDialog: () => null,
}));

vi.mock('@/features/billing/components/enterprise-trial-sales-link', () => ({
  EnterpriseTrialSalesLink: () => null,
}));

const client = new QueryClient();

const dialog = () => (
  <QueryClientProvider client={client}>
    <MemoryRouter>
      <EnterpriseTrialDialog />
    </MemoryRouter>
  </QueryClientProvider>
);

const settle = () =>
  act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 10));
  });

const startTrialAndSave = () =>
  fireEvent.click(screen.getByRole('button', { name: 'Start trial and save' }));

const trialIsOn = () => ({
  state: 'active',
  startedAt: new Date().toISOString(),
  endsAt: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
});

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
  liveStatus = undefined;
  mutate.mockClear();
});

describe('starting the trial from a blocked change', () => {
  it('finishes the blocked change from the hook even if the dialog state was reset', async () => {
    const resume = vi.fn().mockResolvedValue(undefined);
    payload = { featureKey: 'PROJECTS', resume };
    render(dialog());
    startTrialAndSave();
    expect(mutate).toHaveBeenCalledTimes(1);
    payload = null;
    await act(async () => {
      onStarted?.({ state: 'active' });
      await new Promise((resolve) => setTimeout(resolve, 10));
    });
    expect(resume).toHaveBeenCalledTimes(1);
  });

  it('finishes the blocked change once when the start errors but the trial is on', async () => {
    const resume = vi.fn().mockResolvedValue(undefined);
    payload = { featureKey: 'PROJECTS', resume };
    const { rerender } = render(dialog());
    startTrialAndSave();
    startFailed = true;
    liveStatus = trialIsOn();
    rerender(dialog());
    await settle();
    rerender(dialog());
    await settle();
    expect(resume).toHaveBeenCalledTimes(1);
  });

  it('shows the trial as on when the start errors but the re-read status says it started', () => {
    offer = false;
    startFailed = true;
    liveStatus = trialIsOn();
    render(dialog());
    expect(screen.getByText('Your Enterprise plan trial is on')).toBeDefined();
  });
});
