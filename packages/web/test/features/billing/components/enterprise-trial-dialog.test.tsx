/**
 * @vitest-environment jsdom
 */
/* eslint-disable jest-dom/prefer-in-document -- @testing-library/jest-dom is not a dependency of packages/web */
import { ApEdition } from '@activepieces/shared';
import { render, screen } from '@testing-library/react';
import * as React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

let edition: ApEdition = ApEdition.CLOUD;
let access: EnterpriseAccess = 'trial_used';
let offer = false;
let payload: { featureKey?: string } | null = null;

vi.mock('i18next', () => ({
  t: (key: string, values: Record<string, unknown> = {}) =>
    key.replace(/\{(\w+)\}/g, (_match, name: string) => String(values[name])),
}));

vi.mock('canvas-confetti', () => ({
  default: Object.assign(vi.fn(), { reset: vi.fn() }),
}));

vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ refetchQueries: vi.fn() }),
}));

vi.mock('@/hooks/flags-hooks', () => ({
  flagsHooks: { useFlag: () => ({ data: edition }) },
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

vi.mock('@/components/providers/telemetry-provider', () => ({
  useTelemetry: () => ({ capture: vi.fn() }),
}));

vi.mock('@/features/billing/hooks/use-enterprise-gate', () => ({
  useEnterpriseAccess: () => access,
}));

vi.mock('@/features/billing/hooks/use-upgrade-click', () => ({
  useUpgradeClick: () => vi.fn(),
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

vi.mock('@/features/billing/hooks/enterprise-trial-hooks', () => ({
  ENTERPRISE_TRIAL_DAYS: 7,
  enterpriseTrialHooks: {
    useStatus: () => ({ data: undefined }),
    useOffer: () => offer,
    useStart: () => ({
      data: undefined,
      isPending: false,
      isError: false,
      mutate: vi.fn(),
      reset: vi.fn(),
    }),
    useTrial: () => ({
      state: 'none',
      startedAt: null,
      endsAt: null,
      daysLeft: 0,
      endsToday: false,
      ending: false,
      justStarted: false,
      extended: false,
      isPlatformAdmin: true,
      basePlanName: 'Free',
    }),
  },
}));

vi.mock('@/features/billing/components/enterprise-trial-ended-dialog', () => ({
  EnterpriseTrialEndedDialog: () => null,
}));

vi.mock('@/features/billing/components/enterprise-trial-sales-link', () => ({
  EnterpriseTrialSalesLink: ({ label }: { label: string }) => <a>{label}</a>,
}));

import { EnterpriseTrialDialog } from '@/features/billing/components/enterprise-trial-dialog';
import type { EnterpriseAccess } from '@/features/billing/hooks/use-enterprise-gate';

const renderDialog = () =>
  render(
    <MemoryRouter>
      <EnterpriseTrialDialog />
    </MemoryRouter>,
  );

beforeEach(() => {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      disconnect() {}
    },
  );
  edition = ApEdition.CLOUD;
  access = 'trial_used';
  offer = false;
  payload = { featureKey: 'PROJECTS' };
});

describe('one trial dialog for every locked feature', () => {
  it('offers the trial in the start layout when a trial is available', () => {
    offer = true;
    access = 'trial_available';
    renderDialog();
    expect(screen.getByText('What is included')).toBeDefined();
    expect(screen.getByText('How the trial works')).toBeDefined();
    expect(
      screen.getByRole('button', { name: 'Start free trial' }),
    ).toBeDefined();
  });

  it('shows the locked variant in the same layout when no trial is left', () => {
    renderDialog();
    expect(screen.getByText('Team plan and up')).toBeDefined();
    expect(screen.getByText('Give every team its own project')).toBeDefined();
    expect(screen.getByText('What you get')).toBeDefined();
    expect(screen.getByText('How to get it')).toBeDefined();
    expect(screen.getByRole('button', { name: 'Explore plans' })).toBeDefined();
    expect(
      screen.queryByRole('button', { name: 'Start free trial' }),
    ).toBeNull();
  });

  it('uses the same dialog on Community and points to sales', () => {
    edition = ApEdition.COMMUNITY;
    access = 'community';
    renderDialog();
    expect(screen.getByText('Enterprise plan')).toBeDefined();
    expect(screen.getByText('What you get')).toBeDefined();
    expect(screen.getByText('Talk to sales')).toBeDefined();
    expect(screen.queryByRole('button', { name: 'Explore plans' })).toBeNull();
  });
});
