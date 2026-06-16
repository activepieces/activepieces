import { Suspense } from 'react';
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
import { CrashTestPage } from '../routes/crash-test';

import { DefaultRoute } from './default-route';
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

const devRoutes = import.meta.env.DEV
  ? [{ path: '/__crashtest', element: <CrashTestPage /> }]
  : [];

const routes = [
  ...devRoutes,
  ...publicRoutes,
  ...projectRoutes,
  ...authRoutes,
  ...platformRoutes,
  ...chatRoutes,
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
