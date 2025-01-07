import { t } from 'i18next';
import {
  AlertCircle,
  Link2,
  Logs,
  Package,
  Workflow,
  Wrench,
} from 'lucide-react';
import { createContext, useState } from 'react';
import { Navigate } from 'react-router-dom';

import { useEmbedding } from '@/components/embed-provider';
import { issueHooks } from '@/features/issues/hooks/issue-hooks';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { projectHooks } from '@/hooks/project-hooks';
import { isNil, Permission } from '@activepieces/shared';

import { authenticationSession } from '../../lib/authentication-session';

import { AllowOnlyLoggedInUserOnlyGuard } from './allow-logged-in-user-only-guard';
import { Sidebar, SidebarLink } from './sidebar';

type DashboardContainerProps = {
  children: React.ReactNode;
};

export const CloseTaskLimitAlertContext = createContext({
  isAlertClosed: false,
  setIsAlertClosed: (isAlertClosed: boolean) => {},
});

export function DashboardContainer({ children }: DashboardContainerProps) {
  const { platform } = platformHooks.useCurrentPlatform();
  const { data: showIssuesNotification } = issueHooks.useIssuesNotification(
    platform.flowIssuesEnabled,
  );
  const { project } = projectHooks.useCurrentProject();

  const { embedState } = useEmbedding();
  const currentProjectId = authenticationSession.getProjectId();
  const { checkAccess } = useAuthorization();
  const [isAlertClosed, setIsAlertClosed] = useState(false);

  if (isNil(currentProjectId) || currentProjectId === '') {
    return <Navigate to="/sign-in" replace />;
  }
  const embedFilter = (link: SidebarLink) =>
    !embedState.isEmbedded || !!link.showInEmbed;
  const permissionFilter = (link: SidebarLink) =>
    isNil(link.hasPermission) || link.hasPermission;
  const links: SidebarLink[] = [
    {
      to: authenticationSession.appendProjectRoutePrefix('/flows'),
      label: t('Flows'),
      icon: Workflow,
      showInEmbed: true,
      hasPermission: checkAccess(Permission.READ_FLOW),
    },
    {
      to: authenticationSession.appendProjectRoutePrefix('/runs'),
      label: t('Runs'),
      icon: Logs,
      showInEmbed: true,
      hasPermission: checkAccess(Permission.READ_RUN),
    },
    {
      to: authenticationSession.appendProjectRoutePrefix('/issues'),
      label: t('Issues'),
      icon: AlertCircle,
      notification: showIssuesNotification,
      showInEmbed: false,
      hasPermission: checkAccess(Permission.READ_ISSUES),
    },
    {
      to: authenticationSession.appendProjectRoutePrefix('/connections'),
      label: t('Connections'),
      icon: Link2,
      showInEmbed: true,
      hasPermission: checkAccess(Permission.READ_APP_CONNECTION),
    },
    {
      to: authenticationSession.appendProjectRoutePrefix('/releases'),
      label: t('Releases'),
      icon: Package,
      hasPermission: project.releasesEnabled,
    },
    {
      to: authenticationSession.appendProjectRoutePrefix('/settings/general'),
      label: t('Settings'),
      icon: Wrench,
    },
  ]
    .filter(embedFilter)
    .filter(permissionFilter);
  return (
    <AllowOnlyLoggedInUserOnlyGuard>
      <CloseTaskLimitAlertContext.Provider
        value={{
          isAlertClosed,
          setIsAlertClosed,
        }}
      >
        <Sidebar
          isHomeDashboard={true}
          links={links}
          hideSideNav={embedState.hideSideNav}
        >
          {children}
        </Sidebar>
      </CloseTaskLimitAlertContext.Provider>
    </AllowOnlyLoggedInUserOnlyGuard>
  );
}
