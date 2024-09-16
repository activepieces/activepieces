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
import { platformHooks } from '@/hooks/platform-hooks';
import { isNil } from '@activepieces/shared';

import { authenticationSession } from '../../lib/authentication-session';

const iconSize = 20;

const sidebarNavItems = [
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
  },
  {
    title: t('Git Sync'),
    href: '/settings/git-sync',
    icon: <GitBranch size={iconSize} />,
  },
];

interface SettingsLayoutProps {
  children: React.ReactNode;
}

export default function ProjectSettingsLayout({
  children,
}: SettingsLayoutProps) {
  const { platform } = platformHooks.useCurrentPlatform();
  const currentProjectId = authenticationSession.getProjectId();
  if (isNil(currentProjectId)) {
    return <Navigate to="/sign-in" replace />;
  }

  const filterAlerts = (item: SidebarItem) =>
    platform.alertsEnabled || item.title !== t('Alerts');
  const addProjectIdToHref = (item: SidebarItem) => ({
    ...item,
    href: `/projects/${currentProjectId}${item.href}`,
  });

  const filteredNavItems = sidebarNavItems
    .filter(filterAlerts)
    .map(addProjectIdToHref);

  return (
    <SidebarLayout title={t('Settings')} items={filteredNavItems}>
      {children}
    </SidebarLayout>
  );
}
