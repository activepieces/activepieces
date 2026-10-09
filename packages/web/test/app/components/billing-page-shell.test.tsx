/**
 * @vitest-environment jsdom
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import * as React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const getSubscriptionInfo = vi.hoisted(() => vi.fn());

vi.mock('i18next', () => ({
  t: (key: string, params?: Record<string, string>) =>
    key.replace(/\{(\w+)\}/g, (_, name: string) => params?.[name] ?? name),
}));
vi.mock('@/features/billing/api/billing-plans-api', () => ({
  platformBillingApi: { getSubscriptionInfo },
}));
vi.mock('@/hooks/platform-hooks', () => ({
  platformHooks: {
    useCurrentPlatform: () => ({ platform: { id: 'platform-1', plan: {} } }),
  },
}));
vi.mock('@/hooks/flags-hooks', () => ({
  flagsHooks: {
    useFlag: () => ({ data: 'cloud' }),
    useFlags: () => ({ data: {} }),
  },
}));

import { BillingPageShell } from '@/app/components/billing-page-shell';

const renderShell = () =>
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <BillingPageShell lockTitle="Unlock Billing & Usage">
        {({ info }) => <p>plan {String(info.plan.plan)}</p>}
      </BillingPageShell>
    </QueryClientProvider>,
  );

const subscription = { plan: { plan: 'standard' } };

beforeEach(() => {
  getSubscriptionInfo.mockReset();
});

describe('BillingPageShell', () => {
  it('renders the page once the subscription loads', async () => {
    getSubscriptionInfo.mockResolvedValue(subscription);

    renderShell();

    expect(await screen.findByText('plan standard')).toBeTruthy();
    expect(screen.queryByText('Trouble loading billing information')).toBe(
      null,
    );
  });

  it('shows an error state instead of a spinner when the subscription fetch fails', async () => {
    getSubscriptionInfo.mockRejectedValue(new Error('500'));

    renderShell();

    expect(
      await screen.findByText('Trouble loading billing information'),
    ).toBeTruthy();
    expect(screen.queryByText('plan standard')).toBe(null);
  });

  it('recovers when Try again succeeds after a failed fetch', async () => {
    getSubscriptionInfo.mockRejectedValueOnce(new Error('500'));
    getSubscriptionInfo.mockResolvedValue(subscription);

    renderShell();

    fireEvent.click(
      await screen.findByRole('button', { name: /Try again/ }),
    );

    expect(await screen.findByText('plan standard')).toBeTruthy();
    expect(getSubscriptionInfo).toHaveBeenCalledTimes(2);
  });
});
