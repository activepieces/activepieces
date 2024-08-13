import {
  LayoutGrid,
  LogsIcon,
  Puzzle,
  UserCog,
  Workflow,
  Wrench,
} from 'lucide-react';

import { platformHooks } from '@/hooks/platform-hooks';

import { AllowOnlyLoggedInUserOnlyGuard } from './allow-logged-in-user-only-guard';
import { Sidebar, SidebarLink } from './sidebar';

export function PlatformAdminContainer({
  children,
}: {
  children: React.ReactNode;
}) {
  const { platform } = platformHooks.useCurrentPlatform();

  const links: SidebarLink[] = [
    {
      to: '/platform/projects',
      label: 'Projects',
      icon: LayoutGrid,
      locked: !platform.manageProjectsEnabled,
    },
    {
      to: '/platform/audit-logs',
      label: 'Audit Logs',
      icon: LogsIcon,
      locked: !platform.auditLogEnabled,
    },
    {
      to: '/platform/pieces',
      label: 'Pieces',
      icon: Puzzle,
      locked: !platform.managePiecesEnabled,
    },
    {
      to: '/platform/templates',
      label: 'Templates',
      icon: Workflow,
      locked: !platform.manageTemplatesEnabled,
    },
    {
      to: '/platform/users',
      label: 'Users',
      icon: UserCog,
    },
    {
      to: '/platform/settings',
      label: 'Settings',
      icon: Wrench,
    },
  ];

  return (
    <AllowOnlyLoggedInUserOnlyGuard>
      <Sidebar links={links}>{children}</Sidebar>
    </AllowOnlyLoggedInUserOnlyGuard>
  );
}
