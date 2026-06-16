import React, { Suspense } from 'react';

import { PageTitle } from '@/app/components/page-title';
import { RouteLoadingBar } from '@/components/custom/route-loading-bar';
import { lazyWithRetry } from '@/lib/lazy-with-retry';

import { ProjectDashboardLayout } from '../components/project-layout';
import { TemplateDetailsWrapper } from '../guards/template-details-wrapper';

import NotFoundPage from './404-page';
import AuthenticatePage from './authenticate';
import { EmbedPage } from './embed';
import { EmbeddedConnectionDialog } from './embed/embedded-connection-dialog';
import { McpAuthorizePage } from './mcp-authorize';
import { RedirectPage } from './redirect';

const ChatPage = lazyWithRetry(
  () => import('./chat').then((m) => ({ default: m.ChatPage })),
  'public-chat',
);
const FormPage = lazyWithRetry(
  () => import('./forms').then((m) => ({ default: m.FormPage })),
  'public-form',
);
const TemplatesPage = lazyWithRetry(
  () => import('./templates').then((m) => ({ default: m.TemplatesPage })),
  'public-templates',
);

function SuspenseWrapper({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<RouteLoadingBar />}>{children}</Suspense>;
}

export const publicRoutes = [
  {
    path: '/embed',
    element: <EmbedPage></EmbedPage>,
  },
  {
    path: '/embed/connections',
    element: <EmbeddedConnectionDialog></EmbeddedConnectionDialog>,
  },
  {
    path: '/authenticate',
    element: <AuthenticatePage />,
  },
  {
    path: '/templates',
    element: (
      <ProjectDashboardLayout>
        <PageTitle title="Templates">
          <SuspenseWrapper>
            <TemplatesPage />
          </SuspenseWrapper>
        </PageTitle>
      </ProjectDashboardLayout>
    ),
  },
  {
    path: '/templates/:templateId',
    element: <TemplateDetailsWrapper />,
  },
  {
    path: '/forms/:flowId',
    element: (
      <PageTitle title="Forms">
        <SuspenseWrapper>
          <FormPage />
        </SuspenseWrapper>
      </PageTitle>
    ),
  },
  {
    path: '/chats/:flowId',
    element: (
      <PageTitle title="Chats">
        <SuspenseWrapper>
          <ChatPage />
        </SuspenseWrapper>
      </PageTitle>
    ),
  },
  {
    path: '/mcp-authorize',
    element: (
      <PageTitle title="Authorize">
        <McpAuthorizePage />
      </PageTitle>
    ),
  },
  {
    path: '/redirect',
    element: <RedirectPage></RedirectPage>,
  },
  {
    path: '/404',
    element: (
      <PageTitle title="Not Found">
        <NotFoundPage />
      </PageTitle>
    ),
  },
];
