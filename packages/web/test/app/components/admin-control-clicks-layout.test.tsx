/**
 * @vitest-environment jsdom
 */
import { TelemetryEventName } from '@activepieces/shared';
import { fireEvent, render, screen } from '@testing-library/react';
import * as React from 'react';
import { MemoryRouter, RouteObject, useRoutes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const capture = vi.fn();
const embedding = vi.hoisted(() => ({ isEmbedded: false }));

vi.mock('@/components/providers/telemetry-provider', () => ({
  useTelemetry: () => ({ capture }),
}));
vi.mock('@/components/providers/embed-provider', () => ({
  useEmbedding: () => ({ embedState: { isEmbedded: embedding.isEmbedded } }),
}));

import { AdminControlClicksLayout } from '@/app/components/admin-control-clicks-layout';
import { AdminControl, adminControl } from '@/lib/admin-control';

const routes: RouteObject[] = [
  {
    path: '/projects/:projectId/connections',
    element: (
      <button {...adminControl(AdminControl.CONNECTIONS_CONNECTION_SUBMIT)}>
        Save connection
      </button>
    ),
  },
];

const AppRoutes = () =>
  useRoutes([
    { element: <AdminControlClicksLayout routes={routes} />, children: routes },
  ]);

const visit = (url: string) =>
  render(
    <MemoryRouter initialEntries={[url]}>
      <AppRoutes />
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
  embedding.isEmbedded = false;
});

describe('admin control clicks outside the platform pages', () => {
  it('reports a tagged control with the route pattern, never the id in the URL', async () => {
    visit('/projects/p_42/connections');
    fireEvent.click(await screen.findByText('Save connection'));
    expect(capturedClicks()).toEqual([
      {
        control: AdminControl.CONNECTIONS_CONNECTION_SUBMIT,
        page: '/projects/:projectId/connections',
      },
    ]);
  });

  it('stays silent when embedded', async () => {
    embedding.isEmbedded = true;
    visit('/projects/p_42/connections');
    fireEvent.click(await screen.findByText('Save connection'));
    expect(capturedClicks()).toEqual([]);
  });
});
