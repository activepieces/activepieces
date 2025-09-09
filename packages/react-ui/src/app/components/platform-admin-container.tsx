import { ApEdition, ApFlagId } from '@activepieces/shared';
import { t } from 'i18next';
import { LayoutGrid, LineChart, Shield, Users, Wrench } from 'lucide-react';
import { useState } from 'react';
import { Navigate } from 'react-router-dom';

import { AllowOnlyLoggedInUserOnlyGuard } from './allow-logged-in-user-only-guard';
import { SidebarComponent, SidebarItem } from './sidebar';

import { UpgradeDialog } from '@/features/billing/components/upgrade-dialog';
import { useShowPlatformAdminDashboard } from '@/hooks/authorization-hooks';
import { flagsHooks } from '@/hooks/flags-hooks';
import { platformHooks } from '@/hooks/platform-hooks';

type PlatformAdminContainerProps = {
  children: React.ReactNode;
};

export function PlatformAdminContainer({
  children,
}: PlatformAdminContainerProps) {
  const [setupOpen, setSetupOpen] = useState(false);
  const [securityOpen, setSecurityOpen] = useState(false);

  const { platform } = platformHooks.useCurrentPlatform();
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);

  const showPlatformAdminDashboard = useShowPlatformAdminDashboard();

  const items: SidebarItem[] = [
    {
      type: 'link',
      to: '/platform/analytics',
      label: t('Overview'),
      icon: <LineChart />,
      locked: !platform.plan.analyticsEnabled,
      isSubItem: false,
      show: true,
    },
    {
      type: 'link',
      to: '/platform/projects',
      label: t('Projects'),
      icon: <LayoutGrid />,
      locked: !platform.plan.manageProjectsEnabled,
      isSubItem: false,
      show: true,
    },
    {
      type: 'link',
      to: '/platform/users',
      label: t('Users'),
      icon: <Users />,
      isSubItem: false,
      show: true,
    },
    {
      type: 'group',
      label: t('Setup'),
      icon: Wrench,
      defaultOpen: false,
      open: setupOpen,
      setOpen: setSetupOpen,
      isActive: (pathname: string) => pathname.includes('/setup'),
      items: [
        {
          type: 'link',
          to: '/platform/setup/ai',
          label: t('AI'),
          isSubItem: true,
          show: true,
        },
        {
          type: 'link',
          to: '/platform/setup/connections',
          label: t('Global Connections'),
          isSubItem: true,
          show: true,
        },
        {
          type: 'link',
          to: '/platform/setup/pieces',
          label: t('Pieces'),
          isSubItem: true,
          show: true,
        },
        {
          type: 'link',
          to: '/platform/setup/templates',
          label: t('Templates'),
          isSubItem: true,
          show: true,
        },
        {
          type: 'link',
          to: '/platform/setup/billing',
          label: t('Billing'),
          isSubItem: true,
          show: edition !== ApEdition.COMMUNITY,
        },
      ],
    },
    {
      type: 'group',
      label: t('Security'),
      defaultOpen: false,
      open: securityOpen,
      setOpen: setSecurityOpen,
      isActive: (pathname: string) => pathname.includes('/security'),
      icon: Shield,
      items: [
        {
          type: 'link',
          to: '/platform/security/audit-logs',
          label: t('Audit Logs'),
          isSubItem: true,
          show: true,
        },
        {
          type: 'link',
          to: '/platform/security/sso',
          label: t('Single Sign On'),
          isSubItem: true,
          show: true,
        },
        {
          type: 'link',
          to: '/platform/security/signing-keys',
          label: t('Signing Keys'),
          isSubItem: true,
          show: true,
        },
        {
          type: 'link',
          to: '/platform/security/project-roles',
          label: t('Project Roles'),
          isSubItem: true,
          show: true,
        },
      ],
    },
  ];
  return (
    <AllowOnlyLoggedInUserOnlyGuard>
      {showPlatformAdminDashboard ? (
        <SidebarComponent items={items}>{children}</SidebarComponent>
      ) : (
        <Navigate to="/" />
      )}
      {edition === ApEdition.CLOUD && <UpgradeDialog />}
    </AllowOnlyLoggedInUserOnlyGuard>
  );
}
