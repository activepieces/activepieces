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
      href: '/settings/general',
      icon: <Settings size={iconSize} />,
    },
    {
      title: t('Appearance'),
      href: '/settings/appearance',
      icon: <SunMoon size={iconSize} />,
    },
    {
      title: t('Team'),
      href: '/settings/team',
      icon: <Users size={iconSize} />,
      hasPermission: checkAccess(Permission.READ_PROJECT_MEMBER),
    },
    {
      title: t('Pieces'),
      href: '/settings/pieces',
      icon: <Puzzle size={iconSize} />,
    },
    {
      title: t('Alerts'),
      href: '/settings/alerts',
      icon: <Bell size={iconSize} />,
      hasPermission: checkAccess(Permission.READ_ALERT),
    },
    {
      title: t('Git Sync'),
      href: '/settings/git-sync',
      icon: <GitBranch size={iconSize} />,
      hasPermission: checkAccess(Permission.READ_GIT_REPO),
    },
  ];

  const filterAlerts = (item: SidebarItem) =>
    platform.alertsEnabled || item.title !== t('Alerts');
  const filterOnPermission = (item: SidebarItem) =>
    isNil(item.hasPermission) || item.hasPermission;
  const addProjectIdToHref = (item: SidebarItem) => ({
    ...item,
    href: `/projects/${currentProjectId}${item.href}`,
  });

  const filteredNavItems = sidebarNavItems
    .filter(filterAlerts)
    .filter(filterOnPermission)
    .map(addProjectIdToHref);

  return (
    <SidebarLayout title={t('Settings')} items={filteredNavItems}>
      {children}
    </SidebarLayout>
  );
}
