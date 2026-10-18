/**
 * @vitest-environment jsdom
 */
/* eslint-disable jest-dom/prefer-in-document -- @testing-library/jest-dom is not a dependency of packages/web */
/* eslint-disable testing-library/no-container, testing-library/no-node-access -- <video> has no implicit ARIA role */
import { ErrorCode } from '@activepieces/core-utils';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, screen, fireEvent } from '@testing-library/react';
import { AxiosError, AxiosHeaders } from 'axios';
import * as React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

let teamProjectsLimit: number | null = 0;
let aiProvidersEnabled = false;
let edition = 'cloud';
const createProject = vi.fn();
const createProjectHandlers: { onError?: (error: unknown) => void } = {};

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
vi.mock('@/features/connections', () => ({
  globalConnectionsQueries: {
    useGlobalConnections: () => ({ data: { data: [] }, isLoading: false }),
  },
}));
vi.mock('@/features/projects', () => ({
  projectCollectionUtils: {
    invalidate: vi.fn(),
    useCreateProject: (
      _onSuccess: unknown,
      onError: (error: unknown) => void,
    ) => {
      createProjectHandlers.onError = onError;
      return { mutate: createProject, isPending: false };
    },
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

import { FeatureSample } from '@/app/components/enterprise-gate';
import { LockedFeatureGuard } from '@/app/components/locked-feature-guard';
import { PlanFeatureSample } from '@/app/routes/platform/plan-feature-sample';
import { billingDialogHooks } from '@/features/billing/hooks/billing-dialog-hooks';
import { CreateProjectButton } from '@/features/projects/components/create-project-button';

const useEnterpriseTrialDialogStore =
  billingDialogHooks.useEnterpriseTrialDialogStore;

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

const quotaExceededError = () => {
  const config = { headers: new AxiosHeaders() };
  return new AxiosError('quota', 'ERR_BAD_REQUEST', config, undefined, {
    data: { code: ErrorCode.QUOTA_EXCEEDED, params: {} },
    status: 402,
    statusText: 'Payment Required',
    headers: {},
    config,
  });
};

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

  it.each([
    { edition: 'cloud', limit: 3 },
    { edition: 'ce', limit: 1 },
  ])(
    'refuses on the click and opens the trial dialog for team projects on $edition',
    ({ edition: currentEdition, limit }) => {
      edition = currentEdition;
      teamProjectsLimit = limit;
      renderWithQueryClient(
        <CreateProjectButton
          variant="full"
          projects={usedTeamProjects(limit)}
        />,
      );
      fireEvent.click(screen.getByRole('button', { name: /new project/i }));
      const payload = useEnterpriseTrialDialogStore.getState().payload;
      expect(payload?.featureKey).toBe('PROJECTS');
      expect(payload?.resume).toBeUndefined();
      expect(screen.queryAllByRole('textbox')).toHaveLength(0);
      expect(createProject).not.toHaveBeenCalled();
    },
  );

  it('shows the limit instead of a generic error when the server refuses the project', () => {
    edition = 'cloud';
    teamProjectsLimit = null;
    renderWithQueryClient(
      <CreateProjectButton variant="full" projects={usedTeamProjects(1)} />,
    );
    fireEvent.click(screen.getByRole('button', { name: /new project/i }));
    act(() => {
      createProjectHandlers.onError?.(quotaExceededError());
    });
    expect(useEnterpriseTrialDialogStore.getState().payload?.featureKey).toBe(
      'PROJECTS',
    );
    expect(screen.queryAllByRole('textbox')).toHaveLength(0);
  });

  it('still opens the form when the plan has room', () => {
    teamProjectsLimit = 3;
    renderWithQueryClient(
      <CreateProjectButton variant="full" projects={usedTeamProjects(1)} />,
    );
    fireEvent.click(screen.getByRole('button', { name: /new project/i }));
    expect(useEnterpriseTrialDialogStore.getState().payload).toBeNull();
    expect(screen.queryAllByRole('textbox').length).toBeGreaterThan(0);
  });
});

describe('locked feature guard', () => {
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
