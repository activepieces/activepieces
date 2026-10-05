/**
 * @vitest-environment jsdom
 */
/* eslint-disable jest-dom/prefer-in-document, jest-dom/prefer-to-have-attribute -- @testing-library/jest-dom is not a dependency of packages/web */
import {
  ApEdition,
  PlatformAdminLimit,
  PlatformAdminSurface,
  TelemetryEventName,
} from '@activepieces/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, fireEvent, within } from '@testing-library/react';
import * as React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

let teamProjectsLimit: number | null = 0;
let edition: ApEdition = ApEdition.CLOUD;
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
vi.mock('@/features/billing/hooks/billing-hooks', async (importOriginal) => {
  const actual = await importOriginal<
    typeof import('@/features/billing/hooks/billing-hooks')
  >();
  return {
    ...actual,
    billingQueries: {
      ...actual.billingQueries,
      useListPlans: () => ({ data: undefined }),
    },
  };
});
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
import { ADMIN_CONTROL_ATTRIBUTE, AdminControl } from '@/lib/admin-control';

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

const openUpgradeDialog = (callout: RegExp) =>
  fireEvent.click(screen.getByRole('button', { name: callout }));

const dialogButton = (name: RegExp) =>
  within(screen.getByRole('dialog')).getByRole('button', { name });

const capturedNames = () => capture.mock.calls.map(([event]) => event.name);

const capturedPayload = (name: TelemetryEventName) =>
  capture.mock.calls.find(([event]) => event.name === name)?.[0].payload;

beforeEach(() => {
  teamProjectsLimit = 0;
  edition = ApEdition.CLOUD;
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
    openUpgradeDialog(/talk to sales/i);
    expect(capturedNames()).not.toContain(
      TelemetryEventName.PLATFORM_ADMIN_UPGRADE_CLICKED,
    );
    fireEvent.click(dialogButton(/compare all plans/i));
    expect(
      capturedPayload(TelemetryEventName.PLATFORM_ADMIN_UPGRADE_CLICKED),
    ).toEqual({
      feature: 'AUDIT_LOGS',
      tier: 'enterprise',
      surface: PlatformAdminSurface.SAMPLE,
    });
  });

  it('reports the sales enquiry from the sample overlay', () => {
    edition = ApEdition.COMMUNITY;
    render(
      <FeatureSample locked title="Unlock Audit Logs" featureKey="AUDIT_LOGS">
        <div />
      </FeatureSample>,
    );
    openUpgradeDialog(/talk to sales/i);
    expect(capturedNames()).not.toContain(
      TelemetryEventName.PLATFORM_ADMIN_SALES_CONTACTED,
    );
    fireEvent.click(dialogButton(/talk to sales/i));
    expect(
      capturedPayload(TelemetryEventName.PLATFORM_ADMIN_SALES_CONTACTED),
    ).toEqual({ feature: 'AUDIT_LOGS', surface: PlatformAdminSurface.SAMPLE });
  });

  it('reports the sales enquiry from the full page teaser', () => {
    edition = ApEdition.COMMUNITY;
    render(
      <FeatureTeaser featureKey="API" title="Enable API Keys" description="" />,
    );
    openUpgradeDialog(/talk to sales/i);
    fireEvent.click(dialogButton(/talk to sales/i));
    expect(
      capturedPayload(TelemetryEventName.PLATFORM_ADMIN_SALES_CONTACTED),
    ).toEqual({ feature: 'API', surface: PlatformAdminSurface.TEASER });
  });

  it('reports a refused control and the limit behind it, with no control id on the locked trigger', () => {
    teamProjectsLimit = 3;
    renderWithQueryClient(
      <CreateProjectButton variant="icon" projects={usedTeamProjects(3)} />,
    );
    const trigger = screen.getByRole('button');
    expect(trigger.getAttribute(ADMIN_CONTROL_ATTRIBUTE)).toBeNull();
    fireEvent.click(trigger);

    expect(
      capturedPayload(TelemetryEventName.PLATFORM_ADMIN_GATE_BLOCKED),
    ).toEqual({ feature: 'PROJECTS', control: AdminControl.PROJECTS_NEW_OPEN });
    expect(
      capturedPayload(TelemetryEventName.PLATFORM_ADMIN_LIMIT_REACHED),
    ).toEqual({ limit: PlatformAdminLimit.TEAM_PROJECTS, used: 3, allowed: 3 });
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
    fireEvent.click(dialogButton(/upgrade to/i));
    expect(
      capturedPayload(TelemetryEventName.PLATFORM_ADMIN_UPGRADE_CLICKED),
    ).toEqual({
      feature: 'PROJECTS',
      tier: 'team',
      surface: PlatformAdminSurface.DIALOG,
    });
  });

  it('stays silent while the plan still has room', () => {
    teamProjectsLimit = 3;
    renderWithQueryClient(
      <CreateProjectButton variant="full" projects={usedTeamProjects(1)} />,
    );
    const trigger = screen.getByRole('button', { name: /new project/i });
    expect(trigger.getAttribute(ADMIN_CONTROL_ATTRIBUTE)).toBe(
      AdminControl.PROJECTS_NEW_OPEN,
    );
    fireEvent.click(trigger);
    expect(capturedNames()).not.toContain(
      TelemetryEventName.PLATFORM_ADMIN_GATE_BLOCKED,
    );
    expect(capturedNames()).not.toContain(
      TelemetryEventName.PLATFORM_ADMIN_LIMIT_REACHED,
    );
  });
});
