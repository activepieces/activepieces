import { t } from 'i18next';
import {
  Puzzle,
  SunMoon,
  Users,
  Settings,
  Table2,
  Workflow,
  Wrench,
  GitBranch,
  Bell,
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
import {
  SidebarComponent,
  SidebarGroup,
  SidebarItem,
  SidebarLink,
} from './sidebar';

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
  const [automationOpen, setAutomationOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
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

  const filterAlerts = (item: SidebarItem) =>
    platform.alertsEnabled || item.label !== t('Alerts');

  const items: SidebarItem[] = [
    {
      type: 'group',
      label: t('Automation'),
      putEmptySpaceTop: true,
      icon: Workflow,
      isActive: (pathname: string) => {
        const paths = [
          '/flows',
          '/issues',
          '/runs',
          '/connections',
          '/releases',
          '/tables',
        ];
        return paths.some((path) => pathname.includes(path));
      },
      defaultOpen: true,
      open: automationOpen,
      setOpen: setAutomationOpen,
      items: [
        {
          type: 'link',
          to: authenticationSession.appendProjectRoutePrefix('/flows'),
          label: t('Flows'),
          showInEmbed: true,
          hasPermission: checkAccess(Permission.READ_FLOW),
          isSubItem: true,
        },
        {
          type: 'link',
          to: authenticationSession.appendProjectRoutePrefix('/issues'),
          label: t('Issues'),
          notification: showIssuesNotification,
          showInEmbed: false,
          hasPermission: checkAccess(Permission.READ_ISSUES),
          isSubItem: true,
        },

        {
          type: 'link',
          to: authenticationSession.appendProjectRoutePrefix('/runs'),
          label: t('Runs'),
          showInEmbed: true,
          hasPermission: checkAccess(Permission.READ_RUN),
          isSubItem: true,
        },
        {
          type: 'link',
          to: authenticationSession.appendProjectRoutePrefix('/connections'),
          label: t('Connections'),
          showInEmbed: true,
          hasPermission: checkAccess(Permission.READ_APP_CONNECTION),
          isSubItem: true,
        },
        {
          type: 'link',
          to: authenticationSession.appendProjectRoutePrefix('/releases'),
          label: t('Releases'),
          hasPermission:
            project.releasesEnabled &&
            checkAccess(Permission.READ_PROJECT_RELEASE),
          isSubItem: true,
        },
      ],
    } as SidebarGroup,
    {
      type: 'link',
      to: authenticationSession.appendProjectRoutePrefix('/tables'),
      label: t('Tables'),
      icon: Table2,
      showInEmbed: true,
      hasPermission: checkAccess(Permission.READ_TABLE),
      isSubItem: false,
    } as SidebarLink,
    {
      type: 'group',
      label: t('Settings'),
      defaultOpen: false,
      open: settingsOpen,
      setOpen: setSettingsOpen,
      icon: Settings,
      isActive: (pathname: string) => pathname.includes('/settings'),
      items: [
        {
          type: 'link',
          to: authenticationSession.appendProjectRoutePrefix(
            '/settings/general',
          ),
          label: t('General'),
          icon: Wrench,
          isSubItem: true,
        } as SidebarLink,
        {
          type: 'link',
          to: authenticationSession.appendProjectRoutePrefix(
            '/settings/appearance',
          ),
          label: t('Appearance'),
          icon: SunMoon,
          isSubItem: true,
        } as SidebarLink,
        {
          type: 'link',
          to: authenticationSession.appendProjectRoutePrefix('/settings/team'),
          label: t('Team'),
          icon: Users,
          hasPermission: checkAccess(Permission.READ_PROJECT_MEMBER),
          isSubItem: true,
        } as SidebarLink,
        {
          type: 'link',
          to: authenticationSession.appendProjectRoutePrefix(
            '/settings/pieces',
          ),
          label: t('Pieces'),
          icon: Puzzle,
          isSubItem: true,
        } as SidebarLink,
        {
          type: 'link',
          to: authenticationSession.appendProjectRoutePrefix(
            '/settings/alerts',
          ),
          label: t('Alerts'),
          icon: Bell,
          hasPermission: checkAccess(Permission.READ_ALERT),
          isSubItem: true,
        } as SidebarLink,
        {
          type: 'link',
          to: authenticationSession.appendProjectRoutePrefix(
            '/settings/environments',
          ),
          label: t('Environments'),
          icon: GitBranch,
          hasPermission: checkAccess(Permission.READ_PROJECT_RELEASE),
          isSubItem: true,
        } as SidebarLink,
      ],
    } as SidebarGroup,
  ]
    .filter(embedFilter)
    .filter(permissionFilter)
    .filter(filterAlerts);

  for (const item of items) {
    if (item.type === 'group') {
      const newItems = item.items
        .filter(embedFilter)
        .filter(permissionFilter)
        .filter(filterAlerts);
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
