/**
 * @vitest-environment jsdom
 */
/* eslint-disable jest-dom/prefer-in-document -- @testing-library/jest-dom is not a dependency of packages/web */
/* eslint-disable testing-library/no-container, testing-library/no-node-access -- <video> has no implicit ARIA role */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, screen, fireEvent } from '@testing-library/react';
import * as React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

let teamProjectsLimit: number | null = 0;
let aiProvidersEnabled = false;
let edition = 'cloud';
const createProject = vi.fn();

vi.mock('i18next', () => ({ t: (key: string) => key }));

vi.mock('lucide-react', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  Gem: (props: Record<string, unknown>) =>
    React.createElement('span', { ...props, 'data-testid': 'gem' }),
}));

vi.mock('@/hooks/platform-hooks', () => ({
  platformHooks: {
    useCurrentPlatform: () => ({
      platform: {
        plan: {
          billedTeamProjectsLimit: teamProjectsLimit,
          globalConnectionsEnabled: false,
          aiProvidersEnabled,
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
vi.mock(
  '@/features/billing/hooks/billing-dialog-hooks',
  async (importOriginal) => {
    const actual = await importOriginal<
      typeof import('@/features/billing/hooks/billing-dialog-hooks')
    >();
    return {
      ...actual,
      billingDialogHooks: {
        ...actual.billingDialogHooks,
        useManagePlanDialogStore: () => ({ openDialog: vi.fn() }),
      },
    };
  },
);
vi.mock('@/features/connections', () => ({
  globalConnectionsQueries: {
    useGlobalConnections: () => ({ data: { data: [] }, isLoading: false }),
  },
}));
vi.mock('@/features/projects', () => ({
  projectCollectionUtils: {
    invalidate: vi.fn(),
    useCreateProject: () => ({ mutate: createProject, isPending: false }),
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
    <button {...rest} data-testid="new-project-trigger">
      {children}
    </button>
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
import { LockedFeatureGuard } from '@/app/components/locked-feature-guard';
import { PlanFeatureSample } from '@/app/routes/platform/plan-feature-sample';
import { billingDialogHooks } from '@/features/billing/hooks/billing-dialog-hooks';
import { CreateProjectButton } from '@/features/projects/components/create-project-button';

const useEnterpriseTrialDialogStore =
  billingDialogHooks.useEnterpriseTrialDialogStore;

const SHOWCASE_VIDEO =
  'https://cdn.activepieces.com/videos/showcase/api-keys.mp4';

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

beforeEach(() => {
  useEnterpriseTrialDialogStore.getState().closeDialog();
  teamProjectsLimit = 0;
  aiProvidersEnabled = false;
  edition = 'cloud';
  createProject.mockClear();
});

describe('create project gating', () => {
  it('marks the button with a gem when the plan includes no team projects', () => {
    teamProjectsLimit = 0;
    renderWithQueryClient(
      <CreateProjectButton variant="full" projects={usedTeamProjects(0)} />,
    );
    expect(screen.getByTestId('gem')).toBeDefined();
  });

  it('marks the button with a gem when the team project allowance is used up', () => {
    teamProjectsLimit = 3;
    renderWithQueryClient(
      <CreateProjectButton variant="full" projects={usedTeamProjects(3)} />,
    );
    expect(screen.getByTestId('gem')).toBeDefined();
  });

  it('marks every variant with a gem, including the sidebar rail', () => {
    teamProjectsLimit = 0;
    renderWithQueryClient(
      <CreateProjectButton variant="icon" projects={usedTeamProjects(0)} />,
    );
    expect(screen.getByTestId('gem')).toBeDefined();
  });

  it('refuses on the click and opens the upgrade dialog for team projects', () => {
    teamProjectsLimit = 3;
    renderWithQueryClient(
      <CreateProjectButton variant="full" projects={usedTeamProjects(3)} />,
    );
    fireEvent.click(screen.getByRole('button', { name: /new project/i }));
    expect(useEnterpriseTrialDialogStore.getState().payload?.featureKey).toBe(
      'PROJECTS',
    );
    expect(screen.queryAllByRole('textbox')).toHaveLength(0);
    expect(createProject).not.toHaveBeenCalled();
  });

  it('shows the same locked dialog as every other feature on community', () => {
    edition = 'ce';
    teamProjectsLimit = 1;
    renderWithQueryClient(
      <CreateProjectButton variant="full" projects={usedTeamProjects(1)} />,
    );
    fireEvent.click(screen.getByRole('button', { name: /new project/i }));
    expect(screen.getByText('Included in the Enterprise plan')).toBeDefined();
    expect(screen.getByRole('link', { name: /talk to sales/i })).toBeDefined();
    expect(useEnterpriseTrialDialogStore.getState().payload).toBeNull();
    expect(screen.queryAllByRole('textbox')).toHaveLength(0);
  });

  it('opens the project form once the trial lifts the limit and resumes the blocked click', async () => {
    edition = 'cloud';
    teamProjectsLimit = 1;
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const button = (
      <QueryClientProvider client={client}>
        <CreateProjectButton variant="full" projects={usedTeamProjects(1)} />
      </QueryClientProvider>
    );
    const view = render(button);
    fireEvent.click(screen.getByRole('button', { name: /new project/i }));
    const resume = useEnterpriseTrialDialogStore.getState().payload?.resume;
    expect(resume).toBeDefined();
    expect(screen.queryAllByRole('textbox')).toHaveLength(0);
    teamProjectsLimit = null;
    view.rerender(button);
    await act(async () => {
      await resume?.();
    });
    expect(screen.queryAllByRole('textbox').length).toBeGreaterThan(0);
  });

  it('still opens the form when the plan has room', () => {
    teamProjectsLimit = 3;
    renderWithQueryClient(
      <CreateProjectButton variant="full" projects={usedTeamProjects(1)} />,
    );
    fireEvent.click(screen.getByRole('button', { name: /new project/i }));
    expect(
      screen.getByRole('heading', { name: 'Create Project' }),
    ).toBeDefined();
    expect(useEnterpriseTrialDialogStore.getState().payload).toBeNull();
    expect(screen.queryAllByRole('textbox').length).toBeGreaterThan(0);
  });
});

describe('locked feature guard', () => {
  it('plays the showcase video on community, same as every other edition', () => {
    edition = 'ce';
    const { container } = renderWithQueryClient(
      <LockedFeatureGuard
        locked
        featureKey="API"
        lockTitle="Enable API Keys"
        lockDescription=""
        lockVideoUrl={SHOWCASE_VIDEO}
      >
        <div />
      </LockedFeatureGuard>,
    );
    expect(container.querySelector('video')?.getAttribute('src')).toBe(
      SHOWCASE_VIDEO,
    );
  });

  it('offers talk to sales on community', () => {
    edition = 'ce';
    renderWithQueryClient(
      <LockedFeatureGuard
        locked
        featureKey="API"
        lockTitle="Enable API Keys"
        lockDescription=""
      >
        <div />
      </LockedFeatureGuard>,
    );
    expect(screen.getByRole('link', { name: /talk to sales/i })).toBeDefined();
  });

  it('renders the page itself when the feature is unlocked', () => {
    renderWithQueryClient(
      <LockedFeatureGuard
        locked={false}
        featureKey="API"
        lockTitle="Enable API Keys"
        lockDescription=""
      >
        <p>unlocked page</p>
      </LockedFeatureGuard>,
    );
    expect(screen.getByText('unlocked page')).toBeDefined();
    expect(screen.queryByRole('status')).toBeNull();
  });
});

describe('feature sample', () => {
  it('offers talk to sales on community', () => {
    edition = 'ce';
    renderWithQueryClient(
      <FeatureSample locked title="Unlock Audit Logs" featureKey="AUDIT_LOGS">
        <div />
      </FeatureSample>,
    );
    expect(screen.getByRole('link', { name: /talk to sales/i })).toBeDefined();
  });

  it('keeps the sampled page read-only behind the lock', () => {
    renderWithQueryClient(
      <FeatureSample locked title="Unlock Audit Logs" featureKey="AUDIT_LOGS">
        <button type="button">Export logs</button>
      </FeatureSample>,
    );
    expect(screen.queryByRole('button', { name: 'Export logs' })).toBeNull();
    expect(
      screen.getByRole('button', { name: 'Export logs', hidden: true }),
    ).toBeDefined();
  });
});

describe('AI providers plan lock', () => {
  it('locks the providers page when the plan lacks aiProvidersEnabled', () => {
    renderWithQueryClient(
      <PlanFeatureSample feature="aiProviders">
        <h1>AI Center providers</h1>
      </PlanFeatureSample>,
    );
    expect(
      screen.getByRole('heading', { name: 'Bring your own AI providers' }),
    ).toBeDefined();
    expect(
      screen.queryByRole('heading', { name: 'AI Center providers' }),
    ).toBeNull();
  });

  it('renders the providers page untouched when aiProvidersEnabled is on', () => {
    aiProvidersEnabled = true;
    renderWithQueryClient(
      <PlanFeatureSample feature="aiProviders">
        <h1>AI Center providers</h1>
      </PlanFeatureSample>,
    );
    expect(
      screen.getByRole('heading', { name: 'AI Center providers' }),
    ).toBeDefined();
    expect(
      screen.queryByRole('heading', { name: 'Bring your own AI providers' }),
    ).toBeNull();
  });
});
