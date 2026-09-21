/**
 * @vitest-environment jsdom
 */
/* eslint-disable jest-dom/prefer-in-document -- @testing-library/jest-dom is not a dependency of packages/web */
import { TelemetryEventName } from '@activepieces/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, fireEvent } from '@testing-library/react';
import * as React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

let teamProjectsLimit: number | null = 0;
let edition = 'cloud';
const capture = vi.fn();

vi.mock('i18next', () => ({ t: (key: string) => key }));

vi.mock('@/components/providers/telemetry-provider', () => ({
  useTelemetry: () => ({ capture }),
}));

vi.mock('@/hooks/platform-hooks', () => ({
  platformHooks: {
    useCurrentPlatform: () => ({
      platform: {
        plan: {
          billedTeamProjectsLimit: teamProjectsLimit,
          globalConnectionsEnabled: false,
        },
      },
    }),
  },
}));
vi.mock('@/hooks/user-hooks', () => ({
  userHooks: {
    getCurrentUserPlatformRole: () => 'ADMIN',
    useCurrentUser: () => ({ data: undefined }),
  },
}));
vi.mock('@/hooks/authorization-hooks', () => ({
  useIsPlatformAdmin: () => true,
}));
vi.mock('@/hooks/flags-hooks', () => ({
  flagsHooks: {
    useFlag: () => ({ data: edition }),
    useFlags: () => ({ data: {} }),
  },
}));
vi.mock('@/features/billing/stores/manage-plan-dialog-state', () => ({
  useManagePlanDialogStore: () => ({ openDialog: vi.fn() }),
}));
vi.mock('@/features/connections', () => ({
  globalConnectionsQueries: {
    useGlobalConnections: () => ({ data: { data: [] }, isLoading: false }),
  },
}));
vi.mock('@/features/projects', () => ({
  projectCollectionUtils: {
    invalidate: vi.fn(),
    useCreateProject: () => ({ mutate: vi.fn(), isPending: false }),
  },
}));
vi.mock('@/components/custom/global-connection-utils', () => ({
  DefaultTag: () => null,
}));
vi.mock('@/components/custom/multi-select-piece-property', () => ({
  MultiSelectPieceProperty: () => null,
}));
vi.mock('@/components/ui/sonner', () => ({ internalErrorToast: vi.fn() }));
vi.mock('@/components/custom/animated-icon-button', () => ({
  AnimatedIconButton: ({
    children,
    icon: _icon,
    iconSize: _iconSize,
    ...rest
  }: React.PropsWithChildren<Record<string, unknown>>) => (
    <button {...rest}>{children}</button>
  ),
}));
vi.mock('@/components/icons/plus', () => ({ PlusIcon: () => null }));
vi.mock('@/components/ui/sidebar-shadcn', () => ({
  SidebarMenuButton: ({
    children,
    ...rest
  }: React.PropsWithChildren<Record<string, unknown>>) => (
    <button {...rest}>{children}</button>
  ),
}));

import { FeatureSample } from '@/app/components/feature-sample';
import { FeatureTeaser } from '@/app/components/feature-teaser';
import { UpgradeFeatureDialog } from '@/features/billing';
import { CreateProjectButton } from '@/features/projects/components/create-project-button';

const renderWithQueryClient = (ui: React.ReactElement) =>
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      {ui}
    </QueryClientProvider>,
  );

const usedTeamProjects = (count: number) =>
  Array.from({ length: count }, () => ({ type: 'TEAM' })) as never;

const capturedNames = () => capture.mock.calls.map(([event]) => event.name);

const capturedPayload = (name: TelemetryEventName) =>
  capture.mock.calls.find(([event]) => event.name === name)?.[0].payload;

beforeEach(() => {
  teamProjectsLimit = 0;
  edition = 'cloud';
  capture.mockClear();
  vi.stubGlobal('open', vi.fn());
});

describe('platform admin telemetry', () => {
  it('reports the upgrade click from the sample overlay with its tier', () => {
    render(
      <FeatureSample
        locked
        title="Unlock Audit Logs"
        tier="enterprise"
        featureKey="AUDIT_LOGS"
      >
        <div />
      </FeatureSample>,
    );
    fireEvent.click(screen.getByRole('button', { name: /upgrade to/i }));
    expect(
      capturedPayload(TelemetryEventName.PLATFORM_ADMIN_UPGRADE_CLICKED),
    ).toEqual({ feature: 'AUDIT_LOGS', tier: 'enterprise', surface: 'sample' });
  });

  it('reports the sales enquiry from the sample overlay', () => {
    edition = 'ce';
    render(
      <FeatureSample locked title="Unlock Audit Logs" featureKey="AUDIT_LOGS">
        <div />
      </FeatureSample>,
    );
    fireEvent.click(screen.getByRole('button', { name: /contact sales/i }));
    expect(
      capturedPayload(TelemetryEventName.PLATFORM_ADMIN_SALES_CONTACTED),
    ).toEqual({ feature: 'AUDIT_LOGS', surface: 'sample' });
  });

  it('reports the sales enquiry from the full page teaser', () => {
    edition = 'ce';
    render(
      <FeatureTeaser featureKey="API" title="Enable API Keys" description="" />,
    );
    fireEvent.click(screen.getByRole('button', { name: /contact sales/i }));
    expect(
      capturedPayload(TelemetryEventName.PLATFORM_ADMIN_SALES_CONTACTED),
    ).toEqual({ feature: 'API', surface: 'teaser' });
  });

  it('reports a refused control and the limit behind it, naming the variant', () => {
    teamProjectsLimit = 3;
    renderWithQueryClient(
      <CreateProjectButton variant="icon" projects={usedTeamProjects(3)} />,
    );
    fireEvent.click(screen.getByRole('button'));

    expect(
      capturedPayload(TelemetryEventName.PLATFORM_ADMIN_GATE_BLOCKED),
    ).toEqual({ feature: 'PROJECTS', control: 'createProject.icon' });
    expect(
      capturedPayload(TelemetryEventName.PLATFORM_ADMIN_LIMIT_REACHED),
    ).toEqual({ limit: 'teamProjects', used: 3, allowed: 3 });
  });

  it('names the feature by its stable key on every surface, not the title', () => {
    render(
      <UpgradeFeatureDialog
        open
        onOpenChange={vi.fn()}
        featureKey="PROJECTS"
        title="Unlock Projects"
        description=""
        tier="team"
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /upgrade plan/i }));
    expect(
      capturedPayload(TelemetryEventName.PLATFORM_ADMIN_UPGRADE_CLICKED),
    ).toEqual({ feature: 'PROJECTS', tier: 'team', surface: 'dialog' });
  });

  it('stays silent while the plan still has room', () => {
    teamProjectsLimit = 3;
    renderWithQueryClient(
      <CreateProjectButton variant="full" projects={usedTeamProjects(1)} />,
    );
    fireEvent.click(screen.getByRole('button', { name: /new project/i }));
    expect(capturedNames()).not.toContain(
      TelemetryEventName.PLATFORM_ADMIN_GATE_BLOCKED,
    );
    expect(capturedNames()).not.toContain(
      TelemetryEventName.PLATFORM_ADMIN_LIMIT_REACHED,
    );
  });
});
