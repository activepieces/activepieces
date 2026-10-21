/**
 * @vitest-environment jsdom
 */
/* eslint-disable jest-dom/prefer-in-document, jest-dom/prefer-to-have-attribute, jest-dom/prefer-to-have-class, jest-dom/prefer-to-have-text-content -- @testing-library/jest-dom is not a dependency of packages/web */
import { fireEvent, render, screen } from '@testing-library/react';
import * as React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { EnterprisePlanIndicator } from '@/features/billing/components/self-serve-trial-pill';
import { billingDialogHooks } from '@/features/billing/hooks/billing-dialog-hooks';
import type {
  SelfServeTrial,
  SeatGrace,
} from '@/features/billing/hooks/self-serve-trial-hooks';

import { icuI18n } from '../../../i18n/icu-i18n';

const state = vi.hoisted<TestState>(() => ({
  plan: 'free',
  trial: null,
  grace: null,
}));

vi.mock('@/hooks/platform-hooks', () => ({
  platformHooks: {
    useCurrentPlatform: () => ({
      platform: { id: 'platform-1', plan: { plan: state.plan } },
    }),
  },
}));

vi.mock('@/features/billing/hooks/self-serve-trial-hooks', () => ({
  selfServeTrialHooks: {
    useTrial: () => state.trial,
    useSeatGrace: () => state.grace,
  },
}));

vi.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: React.PropsWithChildren) => <>{children}</>,
  TooltipTrigger: ({ children }: React.PropsWithChildren) => <>{children}</>,
  TooltipContent: () => null,
}));

function renderIndicator() {
  return render(
    <MemoryRouter>
      <EnterprisePlanIndicator />
    </MemoryRouter>,
  );
}

function trialOf(overrides: Partial<SelfServeTrial> = {}): SelfServeTrial {
  return {
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
    ...overrides,
  };
}

function graceOf(overrides: Partial<SeatGrace> = {}): SeatGrace {
  return {
    endsAt: new Date(2026, 9, 26, 12, 0, 0),
    daysLeft: 3,
    endsToday: false,
    ending: false,
    seats: 5,
    isPlatformAdmin: true,
    ...overrides,
  };
}

beforeAll(async () => {
  await icuI18n.init();
});

beforeEach(() => {
  state.plan = 'free';
  state.trial = trialOf();
  state.grace = null;
  billingDialogHooks.useTrialSeatDialogStore.setState({ isOpen: false });
});

describe('platform admin plan indicator during the seat grace', () => {
  it('warns that extra users lose access and opens the seat dialog', () => {
    state.grace = graceOf();

    renderIndicator();

    expect(screen.getByText('Enterprise trial ended')).toBeTruthy();
    const detail = screen.getByText('Extra users lose access Oct 26');
    expect(detail.className).toContain('text-warning-11');
    const row = screen.getByRole('button', { name: /Enterprise trial ended/ });
    expect(row.getAttribute('data-ap-control')).toBe('trial.seats.open');

    fireEvent.click(row);

    expect(billingDialogHooks.useTrialSeatDialogStore.getState().isOpen).toBe(
      true,
    );
  });

  it('stays hidden from members', () => {
    state.trial = trialOf({ isPlatformAdmin: false });
    state.grace = graceOf({ isPlatformAdmin: false });

    const view = renderIndicator();

    expect(view.container.textContent).toBe('');
  });

  it('leads with the running trial while one is active', () => {
    state.trial = trialOf({
      state: 'active',
      endsAt: new Date(2026, 9, 28, 12, 0, 0),
      daysLeft: 6,
    });
    state.grace = graceOf();

    renderIndicator();

    expect(screen.getByText('Enterprise plan trial')).toBeTruthy();
    expect(screen.queryByText('Enterprise trial ended')).toBeNull();
  });

  it('shows nothing on a plan without Enterprise once the grace is over', () => {
    const view = renderIndicator();

    expect(view.container.textContent).toBe('');
  });

  it('keeps naming the Enterprise plan for a platform that is on it', () => {
    state.plan = 'enterprise';

    renderIndicator();

    expect(screen.getByText('Enterprise plan')).toBeTruthy();
  });
});

type TestState = {
  plan: string;
  trial: SelfServeTrial | null;
  grace: SeatGrace | null;
};
