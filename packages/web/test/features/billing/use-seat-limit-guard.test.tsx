/**
 * @vitest-environment jsdom
 */
import * as React from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, expect, it, vi } from 'vitest';

vi.mock('i18next', () => ({ t: (key: string) => key }));

vi.mock('@/hooks/authorization-hooks', () => ({
  useIsPlatformAdmin: () => true,
}));

vi.mock('@/hooks/platform-hooks', () => ({
  platformHooks: {
    useCurrentPlatform: () => ({ platform: { id: 'platform-1' } }),
  },
}));

vi.mock('@/features/billing/hooks/billing-hooks', () => ({
  billingQueries: {
    usePlatformSubscription: () => ({
      data: {
        billingEnforced: true,
        plan: { usersLimit: 2 },
        usage: { users: 5 },
        seatsFeature: null,
      },
    }),
  },
}));

vi.mock('@/features/billing/stores/manage-plan-dialog-state', () => ({
  useManagePlanDialogStore: () => ({ openDialog: vi.fn() }),
}));

vi.mock(
  '@/features/billing/components/feature-usage/out-of-seats-dialog',
  () => ({
    OutOfSeatsDialog: () => null,
  }),
);

import { useSeatLimitGuard } from '@/features/billing/hooks/use-seat-limit-guard';

Reflect.set(globalThis, 'IS_REACT_ACT_ENVIRONMENT', true);

function renderGuard() {
  const result: { guard?: ReturnType<typeof useSeatLimitGuard> } = {};
  const Probe = () => {
    result.guard = useSeatLimitGuard();
    return null;
  };
  const root = createRoot(document.createElement('div'));
  act(() => root.render(<Probe />));
  return result.guard!;
}

describe('useSeatLimitGuard on a platform already over its seat limit', () => {
  it('allows a request that needs no new seat', () => {
    expect(renderGuard().ensureSeatsAvailable(0)).toBe(true);
  });

  it('blocks a request that needs a new seat', () => {
    expect(renderGuard().ensureSeatsAvailable(1)).toBe(false);
  });
});
