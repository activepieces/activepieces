import { t } from 'i18next';
import {
  LayoutGrid,
  LineChart,
  LogsIcon,
  Puzzle,
  UserCog,
  Workflow,
  Wrench,
} from 'lucide-react';
import { Navigate } from 'react-router-dom';

import { useShowPlatformAdminDashboard } from '@/hooks/authorization-hooks';
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

  const { data: showPlatformDemo } = flagsHooks.useFlag<boolean>(
    ApFlagId.SHOW_PLATFORM_DEMO,
  );

  const showPlatformAdminDashboard = useShowPlatformAdminDashboard();
  const isLocked = (locked: boolean) => locked || (showPlatformDemo ?? false);

  const links: SidebarLink[] = [
    {
      to: '/platform/analytics',
      label: t('Overview'),
      icon: LineChart,
      locked: isLocked(false),
    },
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
      {showPlatformAdminDashboard ? (
        <Sidebar links={links}>{children}</Sidebar>
      ) : (
        <Navigate to="/flows" />
      )}
    </AllowOnlyLoggedInUserOnlyGuard>
  );
}
