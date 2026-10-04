/**
 * @vitest-environment jsdom
 */
/* eslint-disable jest-dom/prefer-in-document -- @testing-library/jest-dom is not a dependency of packages/web */
import { TelemetryEventName } from '@activepieces/shared';
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
  flagsHooks: { useFlag: () => ({ data: 'cloud' }) },
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
      <button {...adminControl('projects.new.open')}>New Project</button>
      <button>Plain button</button>
      <div {...adminControl('projects.edit.open')}>
        <button {...adminControl('projects.delete.open')}>Row action</button>
      </div>
      {createPortal(
        <button {...adminControl('projects.delete.confirm')}>Delete</button>,
        document.body,
      )}
    </div>
  ),
}));
vi.mock(
  '@/app/routes/platform/setup/pieces/piece-sets/piece-set-details-page',
  () => ({
    PieceSetDetailsPage: () => (
      <button {...adminControl('piece-sets.save.submit')}>Save</button>
    ),
  }),
);

import { platformRoutes } from '@/app/routes/platform-routes';
import { adminControl } from '@/lib/admin-control';

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
      (event) => event.name === TelemetryEventName.PLATFORM_ADMIN_CONTROL_CLICKED,
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
      { control: 'projects.new.open', page: '/platform/projects' },
    ]);
  });

  it('names the page by its route, never by the id in the URL', async () => {
    visit('/platform/pieces/piece-sets/ps_42');
    fireEvent.click(await screen.findByText('Save'));
    expect(capturedClicks()).toEqual([
      {
        control: 'piece-sets.save.submit',
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
      { control: 'projects.delete.confirm', page: '/platform/projects' },
    ]);
  });

  it('reports only the nearest control when one is nested in another', async () => {
    visit('/platform/projects');
    fireEvent.click(await screen.findByText('Row action'));
    expect(capturedClicks()).toEqual([
      { control: 'projects.delete.open', page: '/platform/projects' },
    ]);
  });

  it('stops listening once the page is gone', async () => {
    const { unmount } = visit('/platform/projects');
    await screen.findByText('New Project');
    unmount();
    const stray = document.createElement('button');
    stray.setAttribute('data-ap-control', 'projects.new.open');
    document.body.appendChild(stray);
    fireEvent.click(stray);
    expect(capturedClicks()).toEqual([]);
  });
});
