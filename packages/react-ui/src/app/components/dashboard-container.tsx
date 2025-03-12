import { t } from 'i18next';
import {
  AlertCircle,
  Link2,
  Logs,
  Package,
  Table2,
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
import { SidebarComponent, SidebarGroup, SidebarItem, SidebarLink } from './sidebar';

type DashboardContainerProps = {
  children: React.ReactNode;
  hideHeader?: boolean;
  removeGutters?: boolean;
};

const ProjectChangedRedirector = ({
  currentProjectId,
  children,
}: {
  currentProjectId: string;
  children: React.ReactNode;
}) => {
  projectHooks.useReloadPageIfProjectIdChanged(currentProjectId);
  return children;
};
export const CloseTaskLimitAlertContext = createContext({
  isAlertClosed: false,
  setIsAlertClosed: (isAlertClosed: boolean) => {},
});

export function DashboardContainer({
  children,
  removeGutters,
  hideHeader,
}: DashboardContainerProps) {
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
  const embedFilter = (link: SidebarItem) => {
    if (link.type === 'link') {
      return !embedState.isEmbedded || !!link.showInEmbed;
    }
    return true;
  };
  const permissionFilter = (link: SidebarItem) => {
    if (link.type === 'link') {
      return isNil(link.hasPermission) || link.hasPermission;
    }
    return true;
  };
  const items: SidebarItem[] = [
    {
      type: 'group',
      name: t('Platform'),
      label: t('Automation'),
      icon: Workflow,
      isActive: true,
      defaultOpen: true,
      items: [
        {
          type: 'link',
          to: authenticationSession.appendProjectRoutePrefix('/flows'),
          label: t('Flows'),
          showInEmbed: true,
          hasPermission: checkAccess(Permission.READ_FLOW),
        },
        {
          type: 'link',
          to: authenticationSession.appendProjectRoutePrefix('/issues'),
          label: t('Issues'),
          notification: showIssuesNotification,
          showInEmbed: false,
          hasPermission: checkAccess(Permission.READ_ISSUES),
        },

        {
          type: 'link',
          to: authenticationSession.appendProjectRoutePrefix('/runs'),
          label: t('Runs'),
          showInEmbed: true,
          hasPermission: checkAccess(Permission.READ_RUN),
        },
        {
          type: 'link',
          to: authenticationSession.appendProjectRoutePrefix('/connections'),
          label: t('Connections'),
          showInEmbed: true,
          hasPermission: checkAccess(Permission.READ_APP_CONNECTION),
        },
        {
          type: 'link',
          to: authenticationSession.appendProjectRoutePrefix('/releases'),
          label: t('Releases'),
          hasPermission: project.releasesEnabled,
        },

      ],
    } as SidebarGroup, {
      type: 'link',
      to: authenticationSession.appendProjectRoutePrefix('/tables'),
      label: t('Tables'),
      icon: Table2,
      showInEmbed: true,
      hasPermission: checkAccess(Permission.READ_TABLE),
    } as SidebarLink,
    {
      type: 'link',
      to: authenticationSession.appendProjectRoutePrefix('/settings/general'),
      label: t('Settings'),
      icon: Wrench,
      isActive: (pathname: string) => pathname.includes('/settings'),
    } as SidebarLink,
  ]
    .filter(embedFilter)
    .filter(permissionFilter);

  for (const item of items){
    if (item.type === 'group'){
      const newItems = item.items.filter(embedFilter).filter(permissionFilter);
      item.items = newItems;
    }
  }
  
  return (
    <AllowOnlyLoggedInUserOnlyGuard>
      <ProjectChangedRedirector currentProjectId={currentProjectId}>
        <CloseTaskLimitAlertContext.Provider
          value={{
            isAlertClosed,
            setIsAlertClosed,
          }}
        >
          <SidebarComponent
            removeGutters={removeGutters}
            isHomeDashboard={true}
            hideHeader={hideHeader}
            items={items}
            hideSideNav={embedState.hideSideNav}
          >
            {children}
          </SidebarComponent>
        </CloseTaskLimitAlertContext.Provider>
      </ProjectChangedRedirector>
    </AllowOnlyLoggedInUserOnlyGuard>
  );
}
