import { lazy, Suspense } from 'react';
import {
  Outlet,
  RouterProvider,
  createBrowserRouter,
  createMemoryRouter,
} from 'react-router-dom';

import { PageTitle } from '@/app/components/page-title';
import { authRoutes } from '@/app/routes/auth-routes';
import { platformRoutes } from '@/app/routes/platform-routes';
import {
  projectBareRedirects,
  projectShellRoutes,
  projectStandaloneRoutes,
} from '@/app/routes/project-routes';
import { publicRoutes } from '@/app/routes/public-routes';
import { RouteLoadingBar } from '@/components/custom/route-loading-bar';
import { useEmbedding } from '@/components/providers/embed-provider';
import { CHAT_ROUTE } from '@/lib/route-utils';

import { AllowOnlyLoggedInUserOnlyGuard } from '../components/allow-logged-in-user-only-guard';
import { RouteErrorBoundary } from '../components/global-error-boundary';
import { WorkspaceShell } from '../components/workspace-shell';

import { ChatRouteRedirect } from './chat-route-redirect';
import { DefaultRoute } from './default-route';
import { TokenCheckerWrapper } from './project-route-wrapper';

// Old /chat/:id deep links open that conversation in the persistent chat panel
// via ?chat=. The bare /chat is now a real route (see workspaceShellRoute).
const chatRoutes = [
  { path: '/chat/:conversationId', element: <ChatRouteRedirect /> },
];

// One persistent shell (chat panel + Stage) wraps both the project-agnostic chat
// landing (/chat) and every project route (/projects/:projectId/*). The shell is a
// pathless layout, so it stays mounted as the URL moves between /chat and a project
// resource — only the Stage <Outlet/> swaps — and the chat stream/socket survive.
// The project switch (TokenCheckerWrapper) runs per project route, not on the shell,
// so /chat needs no :projectId and selects no "working project".
const workspaceShellRoute = {
  element: (
    <AllowOnlyLoggedInUserOnlyGuard>
      <WorkspaceShell />
    </AllowOnlyLoggedInUserOnlyGuard>
  ),
  children: [
    { path: CHAT_ROUTE, element: <></> },
    {
      path: '/projects/:projectId',
      element: (
        <TokenCheckerWrapper>
          <Outlet />
        </TokenCheckerWrapper>
      ),
      children: projectShellRoutes,
    },
  ],
};

const CrashTestPage = import.meta.env.DEV
  ? lazy(() =>
      import('../routes/crash-test').then((m) => ({
        default: m.CrashTestPage,
      })),
    )
  : null;

const devRoutes =
  import.meta.env.DEV && CrashTestPage
    ? [
        {
          path: '/__crashtest',
          element: (
            <Suspense fallback={<RouteLoadingBar />}>
              <CrashTestPage />
            </Suspense>
          ),
        },
      ]
    : [];

const routes = [
  ...devRoutes,
  ...publicRoutes,
  workspaceShellRoute,
  ...projectStandaloneRoutes,
  ...projectBareRedirects,
  ...authRoutes,
  ...platformRoutes,
  ...chatRoutes,
  {
    path: '/*',
    element: (
      <PageTitle title="Redirect">
        <DefaultRoute></DefaultRoute>
      </PageTitle>
    ),
  },
];

const routesWithErrorBoundary = routes.map((route) => ({
  errorElement: <RouteErrorBoundary />,
  ...route,
}));

export const memoryRouter = createMemoryRouter(routesWithErrorBoundary);
const browserRouter = createBrowserRouter(routesWithErrorBoundary);

const ApRouter = () => {
  const { embedState } = useEmbedding();
  const router = embedState.isEmbedded ? memoryRouter : browserRouter;
  return <RouterProvider router={router}></RouterProvider>;
};

export { ApRouter };
