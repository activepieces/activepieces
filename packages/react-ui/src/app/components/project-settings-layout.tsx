import { t } from 'i18next';
import {
  Bell,
  GitBranch,
  Puzzle,
  Settings,
  SunMoon,
  Users,
} from 'lucide-react';
import { Navigate } from 'react-router-dom';

import SidebarLayout, { SidebarItem } from '@/app/components/sidebar-layout';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { isNil, Permission } from '@activepieces/shared';

import { authenticationSession } from '../../lib/authentication-session';
import { projectSettingsRoutes } from '../router/project-route-wrapper';

const iconSize = 20;

interface SettingsLayoutProps {
  children: React.ReactNode;
}

export default function ProjectSettingsLayout({
  children,
}: SettingsLayoutProps) {
  const { platform } = platformHooks.useCurrentPlatform();
  const currentProjectId = authenticationSession.getProjectId();
  const { checkAccess } = useAuthorization();
  if (isNil(currentProjectId)) {
    return <Navigate to="/sign-in" replace />;
  }
  const sidebarNavItems: SidebarItem[] = [
    {
      title: t('General'),
      href: authenticationSession.appendProjectRoutePrefix(
        projectSettingsRoutes.general,
      ),
      icon: <Settings size={iconSize} />,
    },
    {
      title: t('Appearance'),
      href: authenticationSession.appendProjectRoutePrefix(
        projectSettingsRoutes.appearance,
      ),
      icon: <SunMoon size={iconSize} />,
    },
    {
      title: t('Team'),
      href: authenticationSession.appendProjectRoutePrefix(
        projectSettingsRoutes.team,
      ),
      icon: <Users size={iconSize} />,
      hasPermission: checkAccess(Permission.READ_PROJECT_MEMBER),
    },
    {
      title: t('Pieces'),
      href: authenticationSession.appendProjectRoutePrefix(
        projectSettingsRoutes.pieces,
      ),
      icon: <Puzzle size={iconSize} />,
    },
    {
      title: t('Alerts'),
      href: authenticationSession.appendProjectRoutePrefix(
        projectSettingsRoutes.alerts,
      ),
      icon: <Bell size={iconSize} />,
      hasPermission: checkAccess(Permission.READ_ALERT),
    },
    {
      title: t('Environments'),
      href: authenticationSession.appendProjectRoutePrefix(
        projectSettingsRoutes.environments,
      ),
      icon: <GitBranch size={iconSize} />,
      hasPermission: checkAccess(Permission.READ_PROJECT_RELEASE),
    },
  ];

  const filterAlerts = (item: SidebarItem) =>
    platform.alertsEnabled || item.title !== t('Alerts');
  const filterOnPermission = (item: SidebarItem) =>
    isNil(item.hasPermission) || item.hasPermission;

  const filteredNavItems = sidebarNavItems
    .filter(filterAlerts)
    .filter(filterOnPermission);

  return (
    <SidebarLayout title={t('Settings')} items={filteredNavItems}>
      {children}
    </SidebarLayout>
  );
}
