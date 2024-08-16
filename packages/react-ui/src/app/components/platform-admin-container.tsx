import { useQueryClient } from '@tanstack/react-query';
import {
  LayoutGrid,
  LogsIcon,
  Puzzle,
  UserCog,
  Workflow,
  Wrench,
} from 'lucide-react';

import { flagsHooks } from '@/hooks/flags-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { ApFlagId } from '@activepieces/shared';

import { AllowOnlyLoggedInUserOnlyGuard } from './allow-logged-in-user-only-guard';
import { Sidebar, SidebarLink } from './sidebar';

type PlatformAdminContainerProps = {
  children: React.ReactNode;
};

export function PlatformAdminContainer({
  children,
}: PlatformAdminContainerProps) {
  const { platform } = platformHooks.useCurrentPlatform();

  const queryClient = useQueryClient();
  const { data: showPlatformDemo } = flagsHooks.useFlag<boolean>(
    ApFlagId.SHOW_PLATFORM_DEMO,
    queryClient,
  );

  const isLocked = (locked: boolean) => locked || (showPlatformDemo ?? false);

  const links: SidebarLink[] = [
    {
      to: '/platform/projects',
      label: 'Projects',
      icon: LayoutGrid,
      locked: isLocked(!platform.manageProjectsEnabled),
    },
    {
      to: '/platform/audit-logs',
      label: 'Audit Logs',
      icon: LogsIcon,
      locked: isLocked(!platform.auditLogEnabled),
    },
    {
      to: '/platform/pieces',
      label: 'Pieces',
      icon: Puzzle,
      locked: isLocked(!platform.managePiecesEnabled),
    },
    {
      to: '/platform/templates',
      label: 'Templates',
      icon: Workflow,
      locked: isLocked(!platform.manageTemplatesEnabled),
    },
    {
      to: '/platform/users',
      label: 'Users',
      icon: UserCog,
      locked: isLocked(false),
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
