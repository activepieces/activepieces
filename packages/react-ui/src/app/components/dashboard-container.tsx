import { t } from 'i18next';
import { Bot, ListTodo, Package, Table2, Workflow } from 'lucide-react';
import { createContext, useState } from 'react';
import { Navigate } from 'react-router-dom';

import mcpDark from '@/assets/img/custom/mcp-dark.svg';
import mcpLight from '@/assets/img/custom/mcp-light.svg';
import { useEmbedding } from '@/components/embed-provider';
import { useTheme } from '@/components/theme-provider';
import { WelcomeTrialDialog } from '@/features/billing/components/trial-dialog';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { flagsHooks } from '@/hooks/flags-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { projectHooks } from '@/hooks/project-hooks';
import { ApFlagId, isNil, Permission } from '@activepieces/shared';

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
  setIsAlertClosed: (_isAlertClosed: boolean) => {},
});

export function DashboardContainer({
  children,
  removeGutters,
  hideHeader,
  removeBottomPadding,
}: DashboardContainerProps) {
  const { theme } = useTheme();
  const { platform } = platformHooks.useCurrentPlatform();
  const { project } = projectHooks.useCurrentProject();
  const { embedState } = useEmbedding();
  const currentProjectId = authenticationSession.getProjectId();
  const { checkAccess } = useAuthorization();

  const { data: showBilling } = flagsHooks.useFlag<boolean>(
    ApFlagId.SHOW_BILLING,
  );

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
    icon: (
      <img
        src={theme === 'dark' ? mcpDark : mcpLight}
        alt="MCP"
        className="color-foreground"
      />
    ),
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
    name: t('Products'),
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
    agentsLink,
    flowsLink,
    tablesLink,
    mcpLink,
    todosLink,
    releasesLink,
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
        {showBilling && <WelcomeTrialDialog />}
      </CloseTaskLimitAlertContext.Provider>
    </ProjectChangedRedirector>
  );
}
