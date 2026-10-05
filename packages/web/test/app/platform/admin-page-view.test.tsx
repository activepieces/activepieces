/**
 * @vitest-environment jsdom
 */
/* eslint-disable jest-dom/prefer-in-document -- @testing-library/jest-dom is not a dependency of packages/web */
import { ApEdition, TelemetryEventName } from '@activepieces/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import * as React from 'react';
import { MemoryRouter, useRoutes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const capture = vi.fn();
let ssoEnabled = true;
let apiKeysEnabled = true;

vi.mock('i18next', () => ({ t: (key: string) => key }));

vi.mock('@/components/providers/telemetry-provider', () => ({
  useTelemetry: () => ({ capture }),
}));

vi.mock('@/hooks/platform-hooks', () => ({
  platformHooks: {
    useCurrentPlatform: () => ({
      platform: { plan: { ssoEnabled, apiKeysEnabled } },
    }),
  },
}));
vi.mock('@/hooks/user-hooks', () => ({
  userHooks: { useCurrentUser: () => ({ data: undefined }) },
}));
vi.mock('@/hooks/flags-hooks', () => ({
  flagsHooks: { useFlag: () => ({ data: ApEdition.CLOUD }) },
}));
vi.mock('@/features/billing/stores/manage-plan-dialog-state', () => ({
  useManagePlanDialogStore: () => ({ openDialog: vi.fn() }),
}));
vi.mock('@/app/components/platform-layout', () => ({
  PlatformLayout: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));
vi.mock('@/app/components/page-title', () => ({
  PageTitle: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));
vi.mock('@/app/routes/platform/projects', () => ({
  default: () => <div>projects</div>,
}));
vi.mock('@/app/routes/platform/infra/health', () => ({
  default: ({ section }: { section: string }) => <div>{section} health</div>,
}));
vi.mock('@/app/routes/platform/security/sso', () => ({
  SSOPage: () => <div>sso</div>,
}));
vi.mock('@/app/routes/platform/security/api-keys', () => ({
  ApiKeysPage: () => <div>api keys</div>,
}));
vi.mock(
  '@/app/routes/platform/setup/pieces/piece-sets/piece-set-details-page',
  () => ({ PieceSetDetailsPage: () => <div>piece set</div> }),
);

import { platformRoutes } from '@/app/routes/platform-routes';

const PlatformRoutes = () => useRoutes(platformRoutes);

const visit = (url: string) =>
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <MemoryRouter initialEntries={[url]}>
        <PlatformRoutes />
      </MemoryRouter>
    </QueryClientProvider>,
  );

const capturedViews = () =>
  capture.mock.calls
    .map(([event]) => event)
    .filter(
      (event) => event.name === TelemetryEventName.PLATFORM_ADMIN_PAGE_VIEWED,
    )
    .map((event) => event.payload);

beforeEach(() => {
  ssoEnabled = true;
  apiKeysEnabled = true;
  capture.mockClear();
});

describe('admin page view telemetry', () => {
  it('names the page by its route, never by the id in the URL', async () => {
    visit('/platform/pieces/policies/ps_42');
    expect(await screen.findByText('piece set')).toBeDefined();
    expect(capturedViews()).toEqual([
      { page: '/platform/pieces/policies/:id', locked: false },
    ]);
  });

  it('counts only the page /platform redirects to', async () => {
    visit('/platform');
    expect(await screen.findByText('projects')).toBeDefined();
    expect(capturedViews()).toEqual([
      { page: '/platform/projects', locked: false },
    ]);
  });

  it('counts only the sub-page a released ?tab= link redirects to', async () => {
    visit('/platform/health?tab=runs');
    expect(await screen.findByText('runs health')).toBeDefined();
    expect(capturedViews()).toEqual([
      { page: '/platform/health/runs', locked: false },
    ]);
  });

  it('counts only the page an old folder URL redirects to', async () => {
    visit('/platform/security/sso');
    expect(await screen.findByText('sso')).toBeDefined();
    expect(capturedViews()).toEqual([{ page: '/platform/sso', locked: false }]);
  });

  it('marks a page shown under the sample overlay as locked', async () => {
    apiKeysEnabled = false;
    visit('/platform/api-keys');
    expect(await screen.findByText('api keys')).toBeDefined();
    expect(capturedViews()).toEqual([
      { page: '/platform/api-keys', locked: true },
    ]);
  });
});
