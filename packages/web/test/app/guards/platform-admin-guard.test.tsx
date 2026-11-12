/**
 * @vitest-environment jsdom
 */
import { cleanup, render, screen } from '@testing-library/react';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { PlatformAdminGuard } from '@/app/guards/platform-admin-guard';

const admin = vi.hoisted(() => ({ value: false }));

vi.mock('@/hooks/authorization-hooks', () => ({
  useIsPlatformAdmin: () => admin.value,
}));

describe('PlatformAdminGuard', () => {
  afterEach(cleanup);

  it('replaces the admin page with the app for non-admins', async () => {
    admin.value = false;
    const router = renderAt('/platform/projects');

    expect(await screen.findByText('App home')).toBeTruthy();
    expect(router.state.historyAction).toBe('REPLACE');
    expect(router.state.location.pathname).toBe('/');
  });

  it('shows the admin page to admins', () => {
    admin.value = true;
    renderAt('/platform/projects');

    expect(screen.getByText('Admin page')).toBeTruthy();
  });
});

function renderAt(path: string) {
  const router = createMemoryRouter(
    [
      { path: '/', element: <p>App home</p> },
      {
        path: '/platform/projects',
        element: (
          <PlatformAdminGuard>
            <p>Admin page</p>
          </PlatformAdminGuard>
        ),
      },
    ],
    { initialEntries: [path] },
  );
  render(<RouterProvider router={router} />);
  return router;
}
