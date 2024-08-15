import {
  Bell,
  GitBranch,
  Puzzle,
  Settings,
  SunMoon,
  Users,
} from 'lucide-react';

import SidebarLayout from '@/app/components/sidebar-layout';

const iconSize = 20;

const sidebarNavItems = [
  {
    title: 'General',
    href: '/settings/general',
    icon: <Settings size={iconSize} />,
  },
  {
    title: 'Appearance',
    href: '/settings/appearance',
    icon: <SunMoon size={iconSize} />,
  },
  {
    title: 'Team',
    href: '/settings/team',
    icon: <Users size={iconSize} />,
  },
  {
    title: 'Pieces',
    href: '/settings/pieces',
    icon: <Puzzle size={iconSize} />,
  },
  {
    title: 'Alerts',
    href: '/settings/alerts',
    icon: <Bell size={iconSize} />,
  },
  {
    title: 'Git Sync',
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
  return (
    <SidebarLayout title="Settings" items={sidebarNavItems}>
      {children}
    </SidebarLayout>
  );
}
