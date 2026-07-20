import React, { Suspense } from 'react';

import { PageTitle } from '@/app/components/page-title';
import { RouteLoadingBar } from '@/components/custom/route-loading-bar';
import { lazyWithRetry } from '@/lib/lazy-with-retry';

import { AllowOnlyLoggedInUserOnlyGuard } from '../components/allow-logged-in-user-only-guard';
import { ProjectDashboardLayout } from '../components/project-layout';

import NotFoundPage from './404-page';
import AuthenticatePage from './authenticate';
import { EmbedPage } from './embed';
import { EmbeddedConnectionDialog } from './embed/embedded-connection-dialog';
import { EmbeddedMcpAuthorizeDialog } from './embed/embedded-mcp-authorize-dialog';
import { EmbeddedMcpSettingsDialog } from './embed/embedded-mcp-settings-dialog';
import { McpAuthorizePage } from './mcp-authorize';
import { RedirectPage } from './redirect';
import { SharedTemplateGate } from './templates/shared-template-gate';

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
    path: '/embed/mcp',
    element: <EmbeddedMcpSettingsDialog></EmbeddedMcpSettingsDialog>,
  },
  {
    path: '/embed/mcp-authorize',
    element: <EmbeddedMcpAuthorizeDialog></EmbeddedMcpAuthorizeDialog>,
  },
  {
    path: '/authenticate',
    element: <AuthenticatePage />,
  },
  {
    path: '/templates',
    // The guard is behavior-preserving here (the layout already redirects
    // logged-out users); it exists so this route's element chain matches the
    // other dashboard routes and the layout (with its docked chat) survives
    // navigating to /templates.
    element: (
      <AllowOnlyLoggedInUserOnlyGuard>
        <ProjectDashboardLayout>
          <PageTitle title="Templates">
            <SuspenseWrapper>
              <TemplatesPage />
            </SuspenseWrapper>
          </PageTitle>
        </ProjectDashboardLayout>
      </AllowOnlyLoggedInUserOnlyGuard>
    ),
  },
  {
    path: '/templates/:templateId',
    // Type-identical chain to /templates so the gallery (and layout/docked
    // chat) survives opening/closing the details dialog, which TemplatesPage
    // renders off the :templateId param. Logged-out visitors fall back to the
    // public shared-template experience instead of the sign-in redirect.
    element: (
      <AllowOnlyLoggedInUserOnlyGuard publicFallback={<SharedTemplateGate />}>
        <ProjectDashboardLayout>
          <PageTitle title="Templates">
            <SuspenseWrapper>
              <TemplatesPage />
            </SuspenseWrapper>
          </PageTitle>
        </ProjectDashboardLayout>
      </AllowOnlyLoggedInUserOnlyGuard>
    ),
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
