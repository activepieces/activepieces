/**
 * @vitest-environment jsdom
 */
/* eslint-disable jest-dom/prefer-in-document -- @testing-library/jest-dom is not a dependency of packages/web */
import { TelemetryEventName } from '@activepieces/shared';
import { render, screen } from '@testing-library/react';
import * as React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const capture = vi.fn();

vi.mock('i18next', () => ({ t: (key: string) => key }));

vi.mock('@/components/providers/telemetry-provider', () => ({
  useTelemetry: () => ({ capture }),
}));

vi.mock('@/hooks/platform-hooks', () => ({
  platformHooks: {
    useCurrentPlatform: () => ({ platform: { plan: {} } }),
  },
}));
vi.mock('@/hooks/flags-hooks', () => ({
  flagsHooks: { useFlag: () => ({ data: 'cloud' }) },
}));
vi.mock('@/app/components/platform-layout', () => ({
  PlatformLayout: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));
vi.mock('@/app/components/page-title', () => ({
  PageTitle: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));
vi.mock('@/app/components/feature-sample', () => ({
  FeatureSample: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));

import { AdminRoute } from '@/app/routes/platform-routes';

const pageWithTabs = {
  id: 'security',
  path: '/platform/security',
  title: 'Security',
  tabs: [
    { id: 'api-keys', label: 'API keys', component: () => <div>keys</div> },
    { id: 'sso', label: 'Single sign on', component: () => <div>sso</div> },
  ],
};

const capturedViews = () =>
  capture.mock.calls
    .map(([event]) => event)
    .filter(
      (event) => event.name === TelemetryEventName.PLATFORM_ADMIN_PAGE_VIEWED,
    )
    .map((event) => event.payload);

const pageWithOverview = {
  ...pageWithTabs,
  overview: () => <div>overview</div>,
};

const renderAt = (search: string, page: unknown = pageWithTabs) =>
  render(
    <MemoryRouter initialEntries={[`/platform/security${search}`]}>
      <AdminRoute page={page as never} />
    </MemoryRouter>,
  );

beforeEach(() => {
  capture.mockClear();
});

describe('admin page view telemetry', () => {
  it('reports the tab that actually rendered', async () => {
    renderAt('?tab=sso');
    expect(await screen.findByText('sso')).toBeDefined();
    expect(capturedViews()).toEqual([
      { page: 'security', tab: 'sso', locked: false },
    ]);
  });

  it('falls back to the first tab when no tab is asked for', async () => {
    renderAt('');
    expect(await screen.findByText('keys')).toBeDefined();
    expect(capturedViews()).toEqual([
      { page: 'security', tab: 'api-keys', locked: false },
    ]);
  });

  it('records only the tab it lands on, never the one it redirects through', () => {
    renderAt('?tab=does-not-exist');
    expect(capturedViews()).toEqual([
      { page: 'security', tab: 'api-keys', locked: false },
    ]);
  });

  it('does not invent a tab view before redirecting to an overview', async () => {
    renderAt('?tab=does-not-exist', pageWithOverview);
    expect(await screen.findByText('overview')).toBeDefined();
    expect(capturedViews()).toEqual([
      { page: 'security', tab: null, locked: false },
    ]);
  });
});
