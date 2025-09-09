import { ApEdition, ApFlagId, isNil, Permission } from '@activepieces/shared';
import { t } from 'i18next';
import { Bot, ListTodo, Package, Table2, Workflow } from 'lucide-react';
import { createContext, useState } from 'react';
import { Navigate } from 'react-router-dom';

import { authenticationSession } from '../../lib/authentication-session';

import { SidebarComponent, SidebarItem, SidebarLink } from './sidebar';

import { McpSvg } from '@/assets/img/custom/mcp';
import { AiCreditsLimitAlert } from '@/features/billing/components/ai-credits-limit-alert';
import { ProjectLockedAlert } from '@/features/billing/components/project-locked-alert';
import { TaskLimitAlert } from '@/features/billing/components/task-limit-alert';
import { WelcomeTrialDialog } from '@/features/billing/components/trial-dialog';
import { UpgradeDialog } from '@/features/billing/components/upgrade-dialog';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { flagsHooks } from '@/hooks/flags-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { projectHooks } from '@/hooks/project-hooks';

type DashboardContainerProps = {
  children: React.ReactNode;
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

export function DashboardContainer({ children }: DashboardContainerProps) {
  const { platform } = platformHooks.useCurrentPlatform();
  const { project } = projectHooks.useCurrentProject();
  const currentProjectId = authenticationSession.getProjectId();
  const { checkAccess } = useAuthorization();
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);
  const { data: showBilling } = flagsHooks.useFlag<boolean>(
    ApFlagId.SHOW_BILLING,
  );

  const [isAlertClosed, setIsAlertClosed] = useState(false);
  if (isNil(currentProjectId) || currentProjectId === '') {
    return <Navigate to="/sign-in" replace />;
  }

  const permissionFilter = (link: SidebarItem) => {
    if (link.type === 'link') {
      return isNil(link.hasPermission) || link.hasPermission;
    }
    return true;
  };

  const releasesLink: SidebarLink = {
    type: 'link',
    to: authenticationSession.appendProjectRoutePrefix('/releases'),
    icon: <Package />,
    label: t('Releases'),
    hasPermission:
      project.releasesEnabled && checkAccess(Permission.READ_PROJECT_RELEASE),
    show: project.releasesEnabled,
    isSubItem: false,
  };

  const flowsLink: SidebarLink = {
    type: 'link',
    to: authenticationSession.appendProjectRoutePrefix('/flows'),
    icon: <Workflow />,
    label: t('Flows'),
    hasPermission: checkAccess(Permission.READ_FLOW),
    isSubItem: false,
    name: t('Products'),
    show: true,
    isActive: (pathname) =>
      pathname.includes('/flows') ||
      pathname.includes('/runs') ||
      pathname.includes('/issues'),
    tutorialTab: 'flows',
  };

  const mcpLink: SidebarLink = {
    type: 'link',
    to: authenticationSession.appendProjectRoutePrefix('/mcps'),
    label: t('MCP'),
    show: platform.plan.mcpsEnabled,
    icon: <McpSvg className="size-4" />,
    hasPermission: checkAccess(Permission.READ_MCP),
    isSubItem: false,
    tutorialTab: 'mcpServers',
  };

  const agentsLink: SidebarLink = {
    type: 'link',
    to: authenticationSession.appendProjectRoutePrefix('/agents'),
    label: t('Agents'),
    icon: <Bot />,
    show: platform.plan.agentsEnabled,
    hasPermission: true,
    isSubItem: false,
    tutorialTab: 'agents',
  };

  const tablesLink: SidebarLink = {
    type: 'link',
    to: authenticationSession.appendProjectRoutePrefix('/tables'),
    label: t('Tables'),
    show: platform.plan.tablesEnabled,
    icon: <Table2 />,
    hasPermission: checkAccess(Permission.READ_TABLE),
    isSubItem: false,
    tutorialTab: 'tables',
  };

  const todosLink: SidebarLink = {
    type: 'link',
    to: authenticationSession.appendProjectRoutePrefix('/todos'),
    label: t('Todos'),
    show: platform.plan.todosEnabled,
    icon: <ListTodo />,
    hasPermission: checkAccess(Permission.READ_TODOS),
    isSubItem: false,
    tutorialTab: 'todos',
  };

  const items: SidebarItem[] = [
    flowsLink,
    agentsLink,
    tablesLink,
    mcpLink,
    todosLink,
    releasesLink,
  ].filter(permissionFilter);

  return (
    <ProjectChangedRedirector currentProjectId={currentProjectId}>
      <CloseTaskLimitAlertContext.Provider
        value={{
          isAlertClosed,
          setIsAlertClosed,
        }}
      >
        <SidebarComponent isHomeDashboard={true} items={items}>
          <>
            <>
              <ProjectLockedAlert />
              <TaskLimitAlert />
              <AiCreditsLimitAlert />
            </>
            {children}
          </>
        </SidebarComponent>
        {showBilling && <WelcomeTrialDialog />}
        {edition === ApEdition.CLOUD && <UpgradeDialog />}
      </CloseTaskLimitAlertContext.Provider>
    </ProjectChangedRedirector>
  );
}
