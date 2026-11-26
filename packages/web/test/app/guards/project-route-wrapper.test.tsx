// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import {
  createMemoryRouter,
  RouterProvider,
  useLocation,
} from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { ProjectRouterWrapper } from '@/app/guards/project-route-wrapper';
import { authenticationSession } from '@/lib/authentication-session';
import { shellHandles } from '@/lib/shell-handle';

vi.mock('i18next', () => ({ t: (key: string) => key }));
vi.mock('@/features/projects', () => ({
  projectCollectionUtils: { useHasAccessToProject: () => true },
}));

function Landing() {
  const { pathname, hash, state } = useLocation();
  return <p>{`${pathname}${hash} ${JSON.stringify(state)}`}</p>;
}

describe('ProjectRouterWrapper', () => {
  it('keeps the history state when a short link adds the project', () => {
    vi.spyOn(authenticationSession, 'getProjectId').mockReturnValue('p1');
    vi.spyOn(authenticationSession, 'switchToProject').mockImplementation(
      () => undefined,
    );
    const router = createMemoryRouter(
      ProjectRouterWrapper({
        path: '/flows/:flowId',
        element: <Landing />,
        handle: shellHandles.project,
      }),
      {
        initialEntries: [
          { pathname: '/flows/f1', hash: '#chat', state: { chatSheet: true } },
        ],
      },
    );

    render(<RouterProvider router={router} />);

    expect(
      screen.getByText('/projects/p1/flows/f1#chat {"chatSheet":true}'),
    ).toBeTruthy();
  });
});
