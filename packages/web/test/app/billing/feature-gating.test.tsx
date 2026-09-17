/**
 * @vitest-environment jsdom
 */
/* eslint-disable jest-dom/prefer-in-document -- @testing-library/jest-dom is not a dependency of packages/web */
/* eslint-disable testing-library/no-container, testing-library/no-node-access -- <video> has no implicit ARIA role */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, fireEvent } from '@testing-library/react';
import * as React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

let teamProjectsLimit: number | null = 0;
let edition = 'cloud';
const createProject = vi.fn();

vi.mock('i18next', () => ({ t: (key: string) => key }));

vi.mock('lucide-react', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  Crown: (props: Record<string, unknown>) =>
    React.createElement('span', { ...props, 'data-testid': 'crown' }),
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
  userHooks: { getCurrentUserPlatformRole: () => 'ADMIN' },
}));
vi.mock('@/hooks/authorization-hooks', () => ({
  useIsPlatformAdmin: () => true,
}));
vi.mock('@/hooks/flags-hooks', () => ({
  flagsHooks: { useFlag: () => ({ data: edition }) },
}));
vi.mock('@/features/billing/stores/manage-plan-dialog-state', () => ({
  useManagePlanDialogStore: () => ({ openDialog: vi.fn() }),
}));
vi.mock('@/features/billing', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
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

import { FeatureTeaser } from '@/app/components/feature-teaser';
import { CreateProjectButton } from '@/features/projects/components/create-project-button';

const LIMIT_REACHED_COPY = "You've reached your team project limit";
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
  teamProjectsLimit = 0;
  edition = 'cloud';
  createProject.mockClear();
});

describe('create project gating', () => {
  it('crowns the button when the plan includes no team projects', () => {
    teamProjectsLimit = 0;
    renderWithQueryClient(
      <CreateProjectButton variant="full" projects={usedTeamProjects(0)} />,
    );
    expect(screen.getByTestId('crown')).toBeDefined();
  });

  it('crowns the button when the team project allowance is used up', () => {
    teamProjectsLimit = 3;
    renderWithQueryClient(
      <CreateProjectButton variant="full" projects={usedTeamProjects(3)} />,
    );
    expect(screen.getByTestId('crown')).toBeDefined();
  });

  it('crowns every variant, including the sidebar rail', () => {
    teamProjectsLimit = 0;
    renderWithQueryClient(
      <CreateProjectButton variant="icon" projects={usedTeamProjects(0)} />,
    );
    expect(screen.getByTestId('crown')).toBeDefined();
  });

  it('refuses on the click instead of after the form is filled in', () => {
    teamProjectsLimit = 3;
    renderWithQueryClient(
      <CreateProjectButton variant="full" projects={usedTeamProjects(3)} />,
    );
    fireEvent.click(screen.getByRole('button', { name: /new project/i }));
    expect(screen.getByText(LIMIT_REACHED_COPY)).toBeDefined();
    expect(screen.queryAllByRole('textbox')).toHaveLength(0);
    expect(createProject).not.toHaveBeenCalled();
  });

  it('still opens the form when the plan has room', () => {
    teamProjectsLimit = 3;
    renderWithQueryClient(
      <CreateProjectButton variant="full" projects={usedTeamProjects(1)} />,
    );
    fireEvent.click(screen.getByRole('button', { name: /new project/i }));
    expect(screen.queryByText(LIMIT_REACHED_COPY)).toBeNull();
    expect(screen.queryAllByRole('textbox').length).toBeGreaterThan(0);
  });
});

describe('feature teaser', () => {
  it('plays the showcase video on community, same as every other edition', () => {
    edition = 'ce';
    const { container } = render(
      <FeatureTeaser
        title="Enable API Keys"
        description=""
        videoUrl={SHOWCASE_VIDEO}
      />,
    );
    expect(container.querySelector('video')?.getAttribute('src')).toBe(
      SHOWCASE_VIDEO,
    );
  });

  it('plays the showcase video on cloud', () => {
    edition = 'cloud';
    const { container } = render(
      <FeatureTeaser
        title="Enable API Keys"
        description=""
        videoUrl={SHOWCASE_VIDEO}
      />,
    );
    expect(container.querySelector('video')?.getAttribute('src')).toBe(
      SHOWCASE_VIDEO,
    );
  });
});
