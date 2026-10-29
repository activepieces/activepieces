/**
 * @vitest-environment jsdom
 */
/* eslint-disable jest-dom/prefer-in-document, jest-dom/prefer-to-have-attribute, jest-dom/prefer-to-have-class, jest-dom/prefer-to-have-text-content -- @testing-library/jest-dom is not a dependency of packages/web */
import { PlatformSelfServeTrial } from '@activepieces/shared';
import { fireEvent, render, screen } from '@testing-library/react';
import dayjs from 'dayjs';
import * as React from 'react';
import { MemoryRouter } from 'react-router-dom';
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { EnterprisePlanIndicator } from '@/features/billing/components/self-serve-trial-sidebar';
import { billingDialogHooks } from '@/features/billing/hooks/billing-dialog-hooks';

import { icuI18n } from '../../../i18n/icu-i18n';

const NOW = new Date(2026, 9, 23, 9, 0, 0);

const state = vi.hoisted<TestState>(() => ({
  plan: 'free',
  selfServeTrial: undefined,
  isPlatformAdmin: true,
}));

vi.mock('@/hooks/platform-hooks', () => ({
  platformHooks: {
    useCurrentPlatform: () => ({
      platform: {
        id: 'platform-1',
        plan: { plan: state.plan, usersLimit: 5 },
        selfServeTrial: state.selfServeTrial,
      },
    }),
  },
}));

vi.mock('@/hooks/authorization-hooks', () => ({
  useIsPlatformAdmin: () => state.isPlatformAdmin,
}));

vi.mock('@/components/providers/telemetry-provider', () => ({
  useTelemetry: () => ({ capture: vi.fn() }),
}));

vi.mock('@/hooks/user-hooks', () => ({
  userHooks: { useCurrentUser: () => ({ data: null }) },
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

function graceEndingIn(days: number): PlatformSelfServeTrial {
  return {
    startedAt: dayjs(NOW).subtract(10, 'day').toISOString(),
    endsAt: dayjs(NOW).subtract(3, 'day').toISOString(),
    seatGraceEndsAt: dayjs(NOW).add(days, 'day').hour(12).toISOString(),
  };
}

beforeAll(async () => {
  await icuI18n.init();
});

beforeEach(() => {
  vi.useFakeTimers({ now: NOW, toFake: ['Date'] });
  state.plan = 'free';
  state.selfServeTrial = undefined;
  state.isPlatformAdmin = true;
  billingDialogHooks.useTrialSeatDialogStore.setState({ isOpen: false });
});

afterEach(() => {
  vi.useRealTimers();
});

describe('platform admin plan indicator during the seat grace', () => {
  it('warns that extra users lose access and opens the seat dialog', () => {
    state.selfServeTrial = graceEndingIn(3);

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
    state.isPlatformAdmin = false;
    state.selfServeTrial = graceEndingIn(3);

    const view = renderIndicator();

    expect(view.container.textContent).toBe('');
  });

  it('leads with the running trial while one is active', () => {
    state.selfServeTrial = {
      ...graceEndingIn(3),
      endsAt: dayjs(NOW).add(5, 'day').toISOString(),
    };

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
  selfServeTrial: PlatformSelfServeTrial | undefined;
  isPlatformAdmin: boolean;
};
