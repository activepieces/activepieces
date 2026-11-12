import { Permission } from '@activepieces/core-utils';
import { lazy, Suspense, useEffect } from 'react';
import {
  Navigate,
  Outlet,
  RouterProvider,
  createBrowserRouter,
  createMemoryRouter,
  useLocation,
} from 'react-router-dom';

import { PageTitle } from '@/app/components/page-title';
import { authRoutes } from '@/app/routes/auth-routes';
import { platformRoutes } from '@/app/routes/platform-routes';
import { projectRoutes } from '@/app/routes/project-routes';
import { publicRoutes, templateRoutes } from '@/app/routes/public-routes';
import { RouteLoadingBar } from '@/components/custom/route-loading-bar';
import { useEmbedding } from '@/components/providers/embed-provider';
import {
  chatPanelUtils,
  useChatPanel,
} from '@/features/workspace/lib/chat-panel-open';
import { lazyWithRetry } from '@/lib/lazy-with-retry';
import { routeLocation } from '@/lib/route-location';
import { shellHandles } from '@/lib/shell-handle';

import { AppShellRoute } from '../components/app-shell';
import { AppToaster } from '../components/app-toaster';
import { RouteErrorBoundary } from '../components/global-error-boundary';

import { AgentsFlagGuard } from './agents-flag-guard';
import { DefaultRoute } from './default-route';
import { RoutePermissionGuard } from './permission-guard';
import { TokenCheckerWrapper } from './project-route-wrapper';

const chatElement = <PageTitle title="Chat">{null}</PageTitle>;

const chatRoutes = [
  { path: '/chat', handle: shellHandles.chat, element: <ChatHome /> },
  {
    path: '/chat/:conversationId',
    handle: shellHandles.chat,
    element: chatElement,
  },
];

const AgentsPage = lazyWithRetry(
  () => import('@/app/routes/agents').then((m) => ({ default: m.AgentsPage })),
  'agents',
);

const agentRoutes = [
  {
    path: '/agents',
    handle: shellHandles.project,
    element: (
      <AgentsFlagGuard>
        <RoutePermissionGuard requiredPermissions={[Permission.READ_AGENT]}>
          <PageTitle title="Agents">
            <Suspense fallback={<RouteLoadingBar />}>
              <AgentsPage />
            </Suspense>
          </PageTitle>
        </RoutePermissionGuard>
      </AgentsFlagGuard>
    ),
  },
];

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

const shellRoutes = [
  ...chatRoutes,
  ...agentRoutes,
  ...projectRoutes,
  ...platformRoutes,
  ...templateRoutes,
  {
    path: '/projects/:projectId',
    handle: shellHandles.projectRedirect,
    element: (
      <TokenCheckerWrapper>
        <DefaultRoute></DefaultRoute>
      </TokenCheckerWrapper>
    ),
  },
  {
    path: '/*',
    handle: shellHandles.publicRedirect,
    element: (
      <PageTitle title="Redirect">
        <DefaultRoute></DefaultRoute>
      </PageTitle>
    ),
  },
];

const routes = [
  {
    element: <AppRoot />,
    errorElement: <RouteErrorBoundary />,
    children: [
      ...[...devRoutes, ...publicRoutes, ...authRoutes].map(withErrorElement),
      {
        element: <AppShellRoute />,
        errorElement: <RouteErrorBoundary />,
        children: shellRoutes.map(withErrorElement),
      },
    ],
  },
];

export const memoryRouter = createMemoryRouter(routes);
const browserRouter = createBrowserRouter(routes);
routeLocation.track(memoryRouter);
routeLocation.track(browserRouter);

const ApRouter = () => {
  const { embedState } = useEmbedding();
  const router = embedState.isEmbedded ? memoryRouter : browserRouter;
  useEffect(() => chatPanelUtils.followRouter(router), [router]);
  return <RouterProvider router={router}></RouterProvider>;
};

export { ApRouter };

function AppRoot() {
  return (
    <>
      <Outlet />
      <AppToaster />
    </>
  );
}

function ChatHome() {
  const conversationId = useChatPanel((s) => s.conversationId);
  const { state } = useLocation();
  if (conversationId !== null) {
    return (
      <Navigate
        to={chatPanelUtils.routeFor(conversationId)}
        replace
        state={state}
      />
    );
  }
  return chatElement;
}

function withErrorElement<T extends object>(route: T) {
  return { errorElement: <RouteErrorBoundary />, ...route };
}
