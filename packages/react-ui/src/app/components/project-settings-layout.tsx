import { Separator } from '@radix-ui/react-dropdown-menu';
import {
  SunMoon,
  Users,
  Puzzle,
  Bell,
  Settings,
  GitBranch,
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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

interface SidebarNavProps extends React.HTMLAttributes<HTMLElement> {
  items: typeof sidebarNavItems;
}

function ProjectSettingsSidebarItem({
  className,
  items,
  ...props
}: SidebarNavProps) {
  const location = useLocation();

  return (
    <nav
      className={cn(
        'flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1',
        className,
      )}
      {...props}
    >
      {items.map((item) => (
        <Link
          key={item.href}
          to={item.href}
          className={cn(
            buttonVariants({ variant: 'ghost' }),
            location.pathname === item.href
              ? 'bg-muted hover:bg-muted'
              : 'hover:bg-transparent hover:underline',
            'justify-start',
          )}
        >
          <div className="flex items-center justify-center gap-2">
            {item.icon}
            {item.title}
          </div>
        </Link>
      ))}
    </nav>
  );
}

export default function ProjectSettingsLayout({
  children,
}: SettingsLayoutProps) {
  return (
    <div className="w-full hidden md:block">
      <div className="space-y-0.5">
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
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
