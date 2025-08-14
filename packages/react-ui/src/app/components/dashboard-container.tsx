import { t } from 'i18next';
import {
  Bot,
  Link2,
  ListTodo,
  Package,
  Shield,
  Table2,
  Workflow,
} from 'lucide-react';
import { createContext, useState } from 'react';
import { Navigate } from 'react-router-dom';

import { McpSvg } from '@/assets/img/custom/mcp';
import { useEmbedding } from '@/components/embed-provider';
import { AiCreditsLimitAlert } from '@/features/billing/components/ai-credits-limit-alert';
import { ProjectLockedAlert } from '@/features/billing/components/project-locked-alert';
import { TaskLimitAlert } from '@/features/billing/components/task-limit-alert';
import { WelcomeTrialDialog } from '@/features/billing/components/trial-dialog';
import { UpgradeDialog } from '@/features/billing/components/upgrade-dialog';
import {
  useAuthorization,
  useShowPlatformAdminDashboard,
} from '@/hooks/authorization-hooks';
import { flagsHooks } from '@/hooks/flags-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { projectHooks } from '@/hooks/project-hooks';
import { ApEdition, ApFlagId, isNil, Permission } from '@activepieces/shared';

import { authenticationSession } from '../../lib/authentication-session';

import { SidebarComponent, SidebarItem } from './sidebar';

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
  const { embedState } = useEmbedding();
  const currentProjectId = authenticationSession.getProjectId();
  const { checkAccess } = useAuthorization();
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);
  const { data: showBilling } = flagsHooks.useFlag<boolean>(
    ApFlagId.SHOW_BILLING,
  );
  const [isAlertClosed, setIsAlertClosed] = useState(false);
  const { show: showPlatformAdminDashboard, notificationDot } =
    useShowPlatformAdminDashboard();
  if (isNil(currentProjectId) || currentProjectId === '') {
    return <Navigate to="/sign-in" replace />;
  }

  const todosLink: SidebarItem = {
    type: 'link',
    to: authenticationSession.appendProjectRoutePrefix('/todos'),
    label: t('Todos'),
    show:
      (platform.plan.todosEnabled || !embedState.isEmbedded) &&
      checkAccess(Permission.READ_TODOS),
    Icon: <ListTodo />,
    isSubItem: false,
    tutorialTab: 'todos',
  };

  const flowsLink: SidebarItem = {
    type: 'link',
    to: authenticationSession.appendProjectRoutePrefix('/flows'),
    Icon: <Workflow />,
    label: t('Flows'),
    isSubItem: false,
    show: checkAccess(Permission.READ_FLOW),
    isActive: (pathname) =>
      pathname.includes('/flows') ||
      pathname.includes('/runs') ||
      pathname.includes('/issues'),
    tutorialTab: 'flows',
  };

  const releasesLink: SidebarItem = {
    type: 'link',
    to: authenticationSession.appendProjectRoutePrefix('/releases'),
    Icon: <Package />,
    label: t('Releases'),
    show:
      project.releasesEnabled && checkAccess(Permission.READ_PROJECT_RELEASE),
    isSubItem: false,
  };

  const tablesLink: SidebarItem = {
    type: 'link',
    to: authenticationSession.appendProjectRoutePrefix('/tables'),
    label: t('Tables'),
    show:
      (platform.plan.tablesEnabled || !embedState.isEmbedded) &&
      checkAccess(Permission.READ_TABLE),
    Icon: <Table2 />,
    isSubItem: false,
    tutorialTab: 'tables',
  };
  const agentsLink: SidebarItem = {
    type: 'link',
    to: authenticationSession.appendProjectRoutePrefix('/agents'),
    label: t('Agents'),
    Icon: <Bot />,
    show: platform.plan.agentsEnabled || !embedState.isEmbedded,
    isSubItem: false,
    tutorialTab: 'agents',
  };

  const connectionsLink: SidebarItem = {
    type: 'link',
    to: authenticationSession.appendProjectRoutePrefix('/connections'),
    label: t('Connections'),
    Icon: <Link2 />,
    show: checkAccess(Permission.READ_APP_CONNECTION),
    isSubItem: false,
  };

  const mcpLink: SidebarItem = {
    type: 'link',
    to: authenticationSession.appendProjectRoutePrefix('/mcps'),
    label: t('MCP'),
    show:
      (platform.plan.mcpsEnabled || !embedState.isEmbedded) &&
      checkAccess(Permission.READ_MCP),
    Icon: <McpSvg className="size-4" />,
    isSubItem: false,
    tutorialTab: 'mcpServers',
  };

  const platformAdminLink: SidebarItem = {
    type: 'link',
    to: '/platform',
    label: t('Platform Admin'),
    Icon: <Shield />,
    isSubItem: false,
    showNotificationDot: notificationDot,
    show: showPlatformAdminDashboard,
  };
  const miscTitle: SidebarItem = {
    type: 'title',
    label: t('Misc'),
  };
  const extensionsTitle: SidebarItem = {
    type: 'title',
    label: t('Extensions'),
  };
  const aiAutomationTitle: SidebarItem = {
    type: 'title',
    label: t('AI Automation'),
  };
  const items: SidebarItem[] = [
    todosLink,
    aiAutomationTitle,
    flowsLink,
    tablesLink,
    extensionsTitle,
    agentsLink,
    connectionsLink,
    mcpLink,
    miscTitle,
    platformAdminLink,
    releasesLink,
  ].filter(
    (link) => link.type === 'title' || (link.type === 'link' && link.show),
  );

  return (
    <ProjectChangedRedirector currentProjectId={currentProjectId}>
      <CloseTaskLimitAlertContext.Provider
        value={{
          isAlertClosed,
          setIsAlertClosed,
        }}
      >
        <SidebarComponent
          isHomeDashboard={true}
          items={items}
          hideSideNav={embedState.hideSideNav}
        >
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
