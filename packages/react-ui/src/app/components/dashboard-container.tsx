import { t } from 'i18next';
import { ListTodo, Package, Server, Table2, Workflow } from 'lucide-react';
import { createContext, useState } from 'react';
import { Navigate } from 'react-router-dom';

import { useEmbedding } from '@/components/embed-provider';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { projectHooks } from '@/hooks/project-hooks';
import { isNil, Permission } from '@activepieces/shared';

import { authenticationSession } from '../../lib/authentication-session';

import { SidebarComponent, SidebarItem, SidebarLink } from './sidebar';

type DashboardContainerProps = {
  children: React.ReactNode;
  hideHeader?: boolean;
  removeGutters?: boolean;
  removeBottomPadding?: boolean;
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
  removeBottomPadding,
}: DashboardContainerProps) {
  const { platform } = platformHooks.useCurrentPlatform();
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

  const filterAlerts = (item: SidebarItem) =>
    platform.alertsEnabled || item.label !== t('Alerts');

  const releasesLink: SidebarLink = {
    type: 'link',
    to: authenticationSession.appendProjectRoutePrefix('/releases'),
    icon: Package,
    label: t('Releases'),
    hasPermission:
      project.releasesEnabled && checkAccess(Permission.READ_PROJECT_RELEASE),

    showInEmbed: true,
    isSubItem: false,
  };

  const flowsLink: SidebarLink = {
    type: 'link',
    to: authenticationSession.appendProjectRoutePrefix('/flows'),
    icon: Workflow,
    label: t('Flows'),
    name: t('Products'),
    showInEmbed: true,
    hasPermission: checkAccess(Permission.READ_FLOW),
    isSubItem: false,
    isActive: (pathname) =>
      pathname.includes('/flows') ||
      pathname.includes('/runs') ||
      pathname.includes('/issues'),
  };

  const mcpLink: SidebarLink = {
    type: 'link',
    to: authenticationSession.appendProjectRoutePrefix('/mcp'),
    label: t('MCP'),
    icon: Server,
    showInEmbed: true,
    hasPermission: checkAccess(Permission.READ_MCP),
    isSubItem: false,
  };

  const tablesLink: SidebarLink = {
    type: 'link',
    to: authenticationSession.appendProjectRoutePrefix('/tables'),
    label: t('Tables'),
    icon: Table2,
    showInEmbed: true,
    hasPermission: checkAccess(Permission.READ_TABLE),
    isSubItem: false,
  };

  const todosLink: SidebarLink = {
    type: 'link',
    to: authenticationSession.appendProjectRoutePrefix('/todos'),
    label: t('Todos'),
    icon: ListTodo,
    showInEmbed: true,
    hasPermission: checkAccess(Permission.READ_TODOS),
    isSubItem: false,
  };

  const items: SidebarItem[] = [
    flowsLink,
    releasesLink,
    mcpLink,
    tablesLink,
    todosLink,
  ]
    .filter(embedFilter)
    .filter(permissionFilter)
    .filter(filterAlerts);

  return (
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
          removeBottomPadding={removeBottomPadding}
        >
          {children}
        </SidebarComponent>
      </CloseTaskLimitAlertContext.Provider>
    </ProjectChangedRedirector>
  );
}
