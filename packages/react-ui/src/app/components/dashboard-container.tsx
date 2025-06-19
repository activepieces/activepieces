import { t } from 'i18next';
import { Bot, ListTodo, Package, Table2, Workflow } from 'lucide-react';
import { createContext, useState } from 'react';
import { Navigate } from 'react-router-dom';

import { McpSvg } from '@/assets/img/custom/mcp';
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

  // TODO(agents): after we enable agents for everyone.
  const filterAgents = (item: SidebarItem) => {
    if (item.label === t('Agents')) {
      return platform.plan.agentsLimit && platform.plan.agentsLimit > 0;
    }
    return true;
  };

  const filterAlerts = (item: SidebarItem) =>
    platform.plan.alertsEnabled || item.label !== t('Alerts');

  const releasesLink: SidebarLink = {
    type: 'link',
    to: authenticationSession.appendProjectRoutePrefix('/releases'),
    icon: <Package />,
    label: t('Releases'),
    hasPermission:
      project.releasesEnabled && checkAccess(Permission.READ_PROJECT_RELEASE),
    showInEmbed: true,
    isSubItem: false,
  };

  const flowsLink: SidebarLink = {
    type: 'link',
    to: authenticationSession.appendProjectRoutePrefix('/flows'),
    icon: <Workflow />,
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
    to: authenticationSession.appendProjectRoutePrefix('/mcps'),
    label: t('MCP'),
    icon: McpSvg,
    showInEmbed: true,
    hasPermission: checkAccess(Permission.READ_MCP),
    isSubItem: false,
  };

  const agentsLink: SidebarLink = {
    type: 'link',
    to: authenticationSession.appendProjectRoutePrefix('/agents'),
    label: t('Agents'),
    icon: <Bot />,
    showInEmbed: false,
    hasPermission: true,
    isSubItem: false,
  };

  const tablesLink: SidebarLink = {
    type: 'link',
    to: authenticationSession.appendProjectRoutePrefix('/tables'),
    label: t('Tables'),
    icon: <Table2 />,
    showInEmbed: true,
    hasPermission: checkAccess(Permission.READ_TABLE),
    isSubItem: false,
  };

  const todosLink: SidebarLink = {
    type: 'link',
    to: authenticationSession.appendProjectRoutePrefix('/todos'),
    label: t('Todos'),
    icon: <ListTodo />,
    showInEmbed: true,
    hasPermission: checkAccess(Permission.READ_TODOS),
    isSubItem: false,
  };

  const items: SidebarItem[] = [
    flowsLink,
    agentsLink,
    mcpLink,
    tablesLink,
    todosLink,
    releasesLink,
  ]
    .filter(embedFilter)
    .filter(permissionFilter)
    .filter(filterAlerts)
    .filter(filterAgents);

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
