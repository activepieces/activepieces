/**
 * @vitest-environment jsdom
 */
/* eslint-disable jest-dom/prefer-in-document -- @testing-library/jest-dom is not a dependency of packages/web */
import { ApEdition, WorkerMachineType } from '@activepieces/shared';
import { render, screen } from '@testing-library/react';
import * as React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({ workerGroupsEnabled: false }));

vi.mock('i18next', () => ({ t: (key: string) => key }));
vi.mock('@/app/components/admin', () => ({
  AdminPage: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  AdminPageHeader: () => null,
  AdminQueryState: () => null,
  AdminEmpty: () => null,
  StatusDot: () => null,
  adminPageResources: { workers: [] },
  adminSurface: {},
}));
vi.mock('@/app/components/enterprise-gate', () => ({
  EnterpriseLockedSection: ({ unlocked }: { unlocked: boolean }) =>
    unlocked ? null : <div data-testid="dedicated-workers-locked" />,
}));
vi.mock('@/app/components/locked-feature-guard', () => ({
  default: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));
vi.mock('@/features/platform-admin', () => ({
  workersQueries: {
    useWorkerMachines: () => ({
      data: [{ id: 'w1', type: WorkerMachineType.SHARED }],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    }),
  },
}));
vi.mock('@/hooks/flags-hooks', () => ({
  flagsHooks: { useFlag: () => ({ data: ApEdition.CLOUD }) },
}));
vi.mock('@/hooks/platform-hooks', () => ({
  platformHooks: {
    useCurrentPlatform: () => ({
      platform: { plan: { workerGroupsEnabled: state.workerGroupsEnabled } },
    }),
  },
}));
vi.mock('@/app/routes/platform/infra/workers/sandboxes-popover', () => ({
  SandboxesPopover: () => null,
}));
vi.mock('@/app/routes/platform/infra/workers/worker-assignments-tab', () => ({
  WorkerAssignmentsTab: () => null,
}));
vi.mock('@/app/routes/platform/infra/workers/worker-configs-popover', () => ({
  WorkerConfigsPopover: () => null,
}));

import WorkersPage from '@/app/routes/platform/infra/workers';

beforeEach(() => {
  state.workerGroupsEnabled = false;
});

describe('Workers health: shared fleet row', () => {
  it('offers the Enterprise plan while worker groups are not part of the plan', () => {
    render(<WorkersPage section="health" />);
    expect(screen.getByTestId('dedicated-workers-locked')).toBeTruthy();
  });

  it('stays out of the way once the plan grants worker groups, as during the trial', () => {
    state.workerGroupsEnabled = true;
    render(<WorkersPage section="health" />);
    expect(screen.queryByTestId('dedicated-workers-locked')).toBeNull();
  });
});
