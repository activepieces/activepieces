import { Separator } from '@radix-ui/react-dropdown-menu';
import { SunMoon, Users, Puzzle, Bell } from 'lucide-react';

import { ProjectSettingsSidebarItem } from './project-settings-sidebar-item';

const iconSize = 20;

const sidebarNavItems = [
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
];

interface SettingsLayoutProps {
  children: React.ReactNode;
}

export default function ProjectSettingsLayout({
  children,
}: SettingsLayoutProps) {
  return (
    <div className="w-full hidden md:block">
      <div className="space-y-0.5">
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">
          Manage your project settings and preferences.
        </p>
      </div>
      <Separator className="my-6" />
      <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
        <aside className="-mx-4 lg:w-1/5">
          <ProjectSettingsSidebarItem items={sidebarNavItems} />
        </aside>
        <div className="w-full flex-1">{children}</div>
      </div>
    </div>
  );
}
