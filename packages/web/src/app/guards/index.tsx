import { Permission } from '@activepieces/core-utils';
import { lazy, Suspense } from 'react';
import {
  RouterProvider,
  createBrowserRouter,
  createMemoryRouter,
} from 'react-router-dom';

import { PageTitle } from '@/app/components/page-title';
import { authRoutes } from '@/app/routes/auth-routes';
import { platformRoutes } from '@/app/routes/platform-routes';
import { projectRoutes } from '@/app/routes/project-routes';
import { publicRoutes } from '@/app/routes/public-routes';
import { RouteLoadingBar } from '@/components/custom/route-loading-bar';
import { useEmbedding } from '@/components/providers/embed-provider';
import { lazyWithRetry } from '@/lib/lazy-with-retry';

import { AllowOnlyLoggedInUserOnlyGuard } from '../components/allow-logged-in-user-only-guard';
import { RouteErrorBoundary } from '../components/global-error-boundary';
import { ProjectDashboardLayout } from '../components/project-layout';

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
    <AllowOnlyLoggedInUserOnlyGuard>
      <ProjectDashboardLayout>
        <PageTitle title="Chat">
          <Suspense fallback={<RouteLoadingBar />}>
            <ChatWithAIPage />
          </Suspense>
        </PageTitle>
      </ProjectDashboardLayout>
    </AllowOnlyLoggedInUserOnlyGuard>
  );
}

const chatRoutes = [
  { path: '/chat', element: chatElement() },
  { path: '/chat/:conversationId', element: chatElement() },
];

const AgentsPage = lazyWithRetry(
  () => import('@/app/routes/agents').then((m) => ({ default: m.AgentsPage })),
  'agents',
);

// The list spans every project the caller can read, so it has no project of its own to sit under.
// A single agent does, and stays project-scoped in project-routes.
const agentRoutes = [
  {
    path: '/agents',
    element: (
      <AllowOnlyLoggedInUserOnlyGuard>
        <AgentsFlagGuard>
          <ProjectDashboardLayout>
            <RoutePermissionGuard requiredPermissions={[Permission.READ_AGENT]}>
              <PageTitle title="Agents">
                <Suspense fallback={<RouteLoadingBar />}>
                  <AgentsPage />
                </Suspense>
              </PageTitle>
            </RoutePermissionGuard>
          </ProjectDashboardLayout>
        </AgentsFlagGuard>
      </AllowOnlyLoggedInUserOnlyGuard>
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

const routes = [
  ...devRoutes,
  ...publicRoutes,
  ...projectRoutes,
  ...authRoutes,
  ...platformRoutes,
  ...chatRoutes,
  ...agentRoutes,
  {
    path: '/projects/:projectId',
    element: (
      <TokenCheckerWrapper>
        <DefaultRoute></DefaultRoute>
      </TokenCheckerWrapper>
    ),
  },
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
