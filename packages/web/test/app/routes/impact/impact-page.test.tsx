// @vitest-environment jsdom
import { PlatformAnalyticsReport } from '@activepieces/shared';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const analytics = vi.hoisted(() => ({
  value: {
    data: null as PlatformAnalyticsReport | null,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  },
}));

vi.mock('i18next', () => ({
  t: (key: string, params?: Record<string, unknown>) =>
    key.replace(/\{(\w+)\}/g, (match, name: string) =>
      params && name in params ? String(params[name]) : match,
    ),
}));
vi.mock('@/features/platform-admin', async () => {
  const { RefreshAnalyticsContext } = await import(
    '@/features/platform-admin/stores/refresh-analytics-context'
  );
  return {
    RefreshAnalyticsContext,
    platformAnalyticsHooks: {
      useAnalyticsTimeBased: () => analytics.value,
      useRefreshAnalytics: () => ({ mutate: vi.fn() }),
    },
  };
});
vi.mock('@/features/projects', () => ({
  projectCollectionUtils: { useAll: () => ({ data: [] }) },
}));
vi.mock('@/hooks/platform-hooks', () => ({
  platformHooks: {
    useCurrentPlatform: () => ({
      platform: { plan: { analyticsEnabled: true } },
    }),
  },
}));

const { default: ImpactPage } = await import('@/app/routes/impact');

function renderPage(route: string) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <ImpactPage />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  analytics.value = {
    data: null,
    isLoading: false,
    isError: true,
    refetch: vi.fn(),
  };
});

afterEach(() => {
  cleanup();
});

describe('ImpactPage when the analytics report fails to load', () => {
  it('shows the error state with a retry on the analytics tab', () => {
    const { container } = renderPage('/impact');
    expect(screen.getByText('Trouble loading analytics')).toBeTruthy();
    expect(container.querySelector('[data-slot="skeleton"]')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(analytics.value.refetch).toHaveBeenCalledTimes(1);
  });

  it('shows the error state with a retry on the details tab', () => {
    renderPage('/impact?tab=details');
    expect(screen.getByText('Trouble loading flows')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(analytics.value.refetch).toHaveBeenCalledTimes(1);
  });

  it('keeps the loading skeletons while the report is still loading', () => {
    analytics.value = { ...analytics.value, isLoading: true, isError: false };
    const { container } = renderPage('/impact');
    expect(screen.queryByText(/Trouble loading/)).toBeNull();
    expect(container.querySelector('[data-slot="skeleton"]')).not.toBeNull();
  });
});
