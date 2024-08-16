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
import { t } from 'i18next';

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
      label: t('Projects'),
      icon: LayoutGrid,
      locked: isLocked(!platform.manageProjectsEnabled),
    },
    {
      to: '/platform/audit-logs',
      label: t('Audit Logs'),
      icon: LogsIcon,
      locked: isLocked(!platform.auditLogEnabled),
    },
    {
      to: '/platform/pieces',
      label: t('Pieces'),
      icon: Puzzle,
      locked: isLocked(!platform.managePiecesEnabled),
    },
    {
      to: '/platform/templates',
      label: t('Templates'),
      icon: Workflow,
      locked: isLocked(!platform.manageTemplatesEnabled),
    },
    {
      to: '/platform/users',
      label: t('Users'),
      icon: UserCog,
      locked: isLocked(false),
    },
    {
      to: '/platform/settings',
      label: t('Settings'),
      icon: Wrench,
    },
  ];

  return (
    <AllowOnlyLoggedInUserOnlyGuard>
      <Sidebar links={links}>{children}</Sidebar>
    </AllowOnlyLoggedInUserOnlyGuard>
  );
}