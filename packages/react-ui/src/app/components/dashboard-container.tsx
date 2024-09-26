import { t } from 'i18next';
import { AlertCircle, Link2, Logs, Workflow, Wrench } from 'lucide-react';
import { Navigate } from 'react-router-dom';

import { useEmbedding } from '@/components/embed-provider';
import { issueHooks } from '@/features/issues/hooks/issue-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { isNil } from '@activepieces/shared';

import { authenticationSession } from '../../lib/authentication-session';

import { AllowOnlyLoggedInUserOnlyGuard } from './allow-logged-in-user-only-guard';
import { Sidebar, SidebarLink } from './sidebar';

type DashboardContainerProps = {
  children: React.ReactNode;
};

export function DashboardContainer({ children }: DashboardContainerProps) {
  const { platform } = platformHooks.useCurrentPlatform();
  const { data: showIssuesNotification } = issueHooks.useIssuesNotification(
    platform.flowIssuesEnabled,
  );

  const { embedState } = useEmbedding();
  const currentProjectId = authenticationSession.getProjectId();
  if (isNil(currentProjectId) || currentProjectId === '') {
    return <Navigate to="/sign-in" replace />;
  }
  const links: SidebarLink[] = [
    {
      to: '/flows',
      label: t('Flows'),
      icon: Workflow,
      showInEmbed: true,
    },
    {
      to: '/runs',
      label: t('Runs'),
      icon: Logs,
      showInEmbed: true,
    },
    {
      to: '/issues',
      label: t('Issues'),
      icon: AlertCircle,
      notification: showIssuesNotification,
      showInEmbed: false,
    },
    {
      to: '/connections',
      label: t('Connections'),
      icon: Link2,
      showInEmbed: true,
    },
    {
      to: '/settings',
      label: t('Settings'),
      icon: Wrench,
      showInEmbed: false,
    },
  ]
    .filter((link) => !embedState.isEmbedded || link.showInEmbed)
    .map((link) => {
      return {
        ...link,
        to: `/projects/${currentProjectId}${link.to}`,
      };
    });

  return (
    <AllowOnlyLoggedInUserOnlyGuard>
      <Sidebar
        isHomeDashboard={true}
        links={links}
        hideSideNav={embedState.hideSideNav}
      >
        {children}
      </Sidebar>
    </AllowOnlyLoggedInUserOnlyGuard>
  );
}
