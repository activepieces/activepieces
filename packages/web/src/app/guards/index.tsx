import { Permission } from '@activepieces/core-utils';
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
import { projectRoutes } from '@/app/routes/project-routes';
import { publicRoutes, templateRoutes } from '@/app/routes/public-routes';
import { RouteLoadingBar } from '@/components/custom/route-loading-bar';
import { useEmbedding } from '@/components/providers/embed-provider';
import { lazyWithRetry } from '@/lib/lazy-with-retry';
import { shellHandles } from '@/lib/shell-handle';

import { AppShellRoute } from '../components/app-shell';
import { AppToaster } from '../components/app-toaster';
import { RouteErrorBoundary } from '../components/global-error-boundary';

import { AgentsFlagGuard } from './agents-flag-guard';
import { DefaultRoute } from './default-route';
import { RoutePermissionGuard } from './permission-guard';
import { TokenCheckerWrapper } from './project-route-wrapper';

const ChatWithAIPage = lazyWithRetry(
  () =>
    import('@/app/routes/chat-with-ai').then((m) => ({
      default: m.ChatWithAIPage,
    })),
  'chat-with-ai',
);

function chatElement() {
  return (
    <PageTitle title="Chat">
      <Suspense fallback={<RouteLoadingBar />}>
        <ChatWithAIPage />
      </Suspense>
    </PageTitle>
  );
}

const chatRoutes = [
  { path: '/chat', handle: shellHandles.chat, element: chatElement() },
  {
    path: '/chat/:conversationId',
    handle: shellHandles.chat,
    element: chatElement(),
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

const ApRouter = () => {
  const { embedState } = useEmbedding();
  const router = embedState.isEmbedded ? memoryRouter : browserRouter;
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

function withErrorElement<T extends object>(route: T) {
  return { errorElement: <RouteErrorBoundary />, ...route };
}
