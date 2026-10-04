/**
 * @vitest-environment jsdom
 */
/* eslint-disable jest-dom/prefer-in-document -- @testing-library/jest-dom is not a dependency of packages/web */
import { ApEdition, TelemetryEventName } from '@activepieces/shared';
import { fireEvent, render, screen } from '@testing-library/react';
import * as React from 'react';
import { createPortal } from 'react-dom';
import { MemoryRouter, useRoutes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const capture = vi.fn();

vi.mock('i18next', () => ({ t: (key: string) => key }));

vi.mock('@/components/providers/telemetry-provider', () => ({
  useTelemetry: () => ({ capture }),
}));

vi.mock('@/hooks/platform-hooks', () => ({
  platformHooks: {
    useCurrentPlatform: () => ({ platform: { plan: { ssoEnabled: true } } }),
  },
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
  default: () => (
    <div>
      <button {...adminControl(AdminControl.PROJECTS_NEW_OPEN)}>
        New Project
      </button>
      <button>Plain button</button>
      <div {...adminControl(AdminControl.PROJECTS_EDIT_OPEN)}>
        <button {...adminControl(AdminControl.PROJECTS_DELETE_OPEN)}>
          Row action
        </button>
      </div>
      {createPortal(
        <button {...adminControl(AdminControl.PROJECTS_DELETE_CONFIRM)}>
          Delete
        </button>,
        document.body,
      )}
    </div>
  ),
}));
vi.mock(
  '@/app/routes/platform/setup/pieces/piece-sets/piece-set-details-page',
  () => ({
    PieceSetDetailsPage: () => (
      <button {...adminControl(AdminControl.PIECE_SETS_SAVE_SUBMIT)}>
        Save
      </button>
    ),
  }),
);

import { platformRoutes } from '@/app/routes/platform-routes';
import {
  ADMIN_CONTROL_ATTRIBUTE,
  AdminControl,
  adminControl,
} from '@/lib/admin-control';

const PlatformRoutes = () => useRoutes(platformRoutes);

const visit = (url: string) =>
  render(
    <MemoryRouter initialEntries={[url]}>
      <PlatformRoutes />
    </MemoryRouter>,
  );

const capturedClicks = () =>
  capture.mock.calls
    .map(([event]) => event)
    .filter(
      (event) =>
        event.name === TelemetryEventName.PLATFORM_ADMIN_CONTROL_CLICKED,
    )
    .map((event) => event.payload);

beforeEach(() => {
  capture.mockClear();
});

describe('admin control click telemetry', () => {
  it('reports the control id with the route pattern of the page', async () => {
    visit('/platform/projects');
    fireEvent.click(await screen.findByText('New Project'));
    expect(capturedClicks()).toEqual([
      { control: AdminControl.PROJECTS_NEW_OPEN, page: '/platform/projects' },
    ]);
  });

  it('names the page by its route, never by the id in the URL', async () => {
    visit('/platform/pieces/piece-sets/ps_42');
    fireEvent.click(await screen.findByText('Save'));
    expect(capturedClicks()).toEqual([
      {
        control: AdminControl.PIECE_SETS_SAVE_SUBMIT,
        page: '/platform/pieces/piece-sets/:id',
      },
    ]);
  });

  it('stays silent for a button that carries no control id', async () => {
    visit('/platform/projects');
    fireEvent.click(await screen.findByText('Plain button'));
    expect(capturedClicks()).toEqual([]);
  });

  it('reports a control rendered in a portal, such as a dialog button', async () => {
    visit('/platform/projects');
    await screen.findByText('New Project');
    fireEvent.click(screen.getByText('Delete'));
    expect(capturedClicks()).toEqual([
      {
        control: AdminControl.PROJECTS_DELETE_CONFIRM,
        page: '/platform/projects',
      },
    ]);
  });

  it('reports only the nearest control when one is nested in another', async () => {
    visit('/platform/projects');
    fireEvent.click(await screen.findByText('Row action'));
    expect(capturedClicks()).toEqual([
      {
        control: AdminControl.PROJECTS_DELETE_OPEN,
        page: '/platform/projects',
      },
    ]);
  });

  it('stops listening once the page is gone', async () => {
    const { unmount } = visit('/platform/projects');
    await screen.findByText('New Project');
    unmount();
    const stray = document.createElement('button');
    stray.setAttribute(ADMIN_CONTROL_ATTRIBUTE, AdminControl.PROJECTS_NEW_OPEN);
    document.body.appendChild(stray);
    fireEvent.click(stray);
    expect(capturedClicks()).toEqual([]);
  });
});
