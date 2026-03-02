import { PageTitle } from '@/app/components/page-title';

import { ProjectDashboardLayout } from '../components/project-layout';
import { TemplateDetailsWrapper } from '../guards/template-details-wrapper';

import NotFoundPage from './404-page';
import AuthenticatePage from './authenticate';
import { ChatPage } from './chat';
import { EmbedPage } from './embed';
import { EmbeddedConnectionDialog } from './embed/embedded-connection-dialog';
import { FormPage } from './forms';
import { RedirectPage } from './redirect';
import { TemplatesPage } from './templates';

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
          <TemplatesPage />
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
        <FormPage />
      </PageTitle>
    ),
  },
  {
    path: '/chats/:flowId',
    element: (
      <PageTitle title="Chats">
        <ChatPage />
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
