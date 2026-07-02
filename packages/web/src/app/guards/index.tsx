import { lazy, Suspense } from 'react';
import {
  Outlet,
  type RouteObject,
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
import { EmbedShell } from '../components/workspace-shell/embed-shell';

import { ChatRouteRedirect } from './chat-route-redirect';
import { DefaultRoute } from './default-route';
import { TokenCheckerWrapper } from './project-route-wrapper';

// Old /chat/:id deep links open that conversation in the persistent chat panel
// via ?chat=. The bare /chat is now a real route (see workspaceShellRoute).
const chatRoutes = [
  { path: '/chat/:conversationId', element: <ChatRouteRedirect /> },
];

// The project-scoped surfaces (builder, runs, tables, connections, …) are SHARED by
// both shells below — one source of truth, so a new project route is automatically
// reachable in the operator app and the embed. TokenCheckerWrapper runs the auth
// guard + project switch before any child renders.
const projectShellChildren = {
  path: '/projects/:projectId',
  element: (
    <TokenCheckerWrapper>
      <Outlet />
    </TokenCheckerWrapper>
  ),
  children: projectShellRoutes,
};

// Operator app: one persistent shell (chat panel + Stage) wraps both the
// project-agnostic chat landing (/chat) and every project route. The shell is a
// pathless layout, so it stays mounted as the URL moves between /chat and a project
// resource — only the Stage <Outlet/> swaps — and the chat stream/socket survive.
const workspaceShellRoute = {
  element: (
    <AllowOnlyLoggedInUserOnlyGuard>
      <WorkspaceShell />
    </AllowOnlyLoggedInUserOnlyGuard>
  ),
  children: [{ path: CHAT_ROUTE, element: <></> }, projectShellChildren],
};

// Embedded app (iframe): a separate, minimal shell with NONE of the operator chrome
// (no Stage, no chat, no global search, no sidebar) and no /chat landing — so an
// embed can never surface the chat UI or get stranded on it. Operator chrome added
// to WorkspaceShell can't leak here because the embed tree never mounts it. See the
// router fork in ApRouter, which already branches on isEmbedded.
const embedShellRoute = {
  element: (
    <AllowOnlyLoggedInUserOnlyGuard>
      <EmbedShell />
    </AllowOnlyLoggedInUserOnlyGuard>
  ),
  children: [projectShellChildren],
};

const CrashTestPage = import.meta.env.DEV
  ? lazy(() =>
      import('../routes/crash-test').then((m) => ({
        default: m.CrashTestPage,
      })),
    )
  : null;

const AgentHarnessPage = import.meta.env.DEV
  ? lazy(() =>
      import('../routes/agent-harness').then((m) => ({
        default: m.AgentHarnessPage,
      })),
    )
  : null;

const devRoutes = import.meta.env.DEV
  ? [
      ...(CrashTestPage
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
        : []),
      ...(AgentHarnessPage
        ? [
            {
              path: '/__agent-harness',
              element: (
                <Suspense fallback={<RouteLoadingBar />}>
                  <AgentHarnessPage />
                </Suspense>
              ),
            },
          ]
        : []),
    ]
  : [];

const catchAllRedirect = {
  path: '/*',
  element: (
    <PageTitle title="Redirect">
      <DefaultRoute></DefaultRoute>
    </PageTitle>
  ),
};

// Operator app (real browser URL): persistent WorkspaceShell + /chat landing.
// Exported for the embed-isolation guardrail test (see test/app/guards).
export const browserRoutes: RouteObject[] = [
  ...devRoutes,
  ...publicRoutes,
  workspaceShellRoute,
  ...projectStandaloneRoutes,
  ...projectBareRedirects,
  ...authRoutes,
  ...platformRoutes,
  ...chatRoutes,
  catchAllRedirect,
];

// Embedded app (in-memory URL inside the iframe): the same routes wrapped in the
// chrome-free EmbedShell, with NO /chat landing or its legacy redirect.
export const embedRoutes: RouteObject[] = [
  ...devRoutes,
  ...publicRoutes,
  embedShellRoute,
  ...projectStandaloneRoutes,
  ...projectBareRedirects,
  ...authRoutes,
  ...platformRoutes,
  catchAllRedirect,
];

const withErrorBoundary = (routes: RouteObject[]): RouteObject[] =>
  routes.map((route) => ({ errorElement: <RouteErrorBoundary />, ...route }));

export const memoryRouter = createMemoryRouter(withErrorBoundary(embedRoutes));
const browserRouter = createBrowserRouter(withErrorBoundary(browserRoutes));

const ApRouter = () => {
  const { embedState } = useEmbedding();
  const router = embedState.isEmbedded ? memoryRouter : browserRouter;
  return <RouterProvider router={router}></RouterProvider>;
};

export { ApRouter };
