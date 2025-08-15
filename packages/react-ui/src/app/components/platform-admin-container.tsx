import { t } from 'i18next';
import {
  ArrowLeft,
  LayoutGrid,
  LineChart,
  Server,
  Shield,
  Users,
  Wrench,
} from 'lucide-react';
import { useState } from 'react';
import { Navigate } from 'react-router-dom';

import { UpgradeDialog } from '@/features/billing/components/upgrade-dialog';
import { useShowPlatformAdminDashboard } from '@/hooks/authorization-hooks';
import { flagsHooks } from '@/hooks/flags-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { ApEdition, ApFlagId } from '@activepieces/shared';

import { AllowOnlyLoggedInUserOnlyGuard } from './allow-logged-in-user-only-guard';
import { SidebarComponent, SidebarItem } from './sidebar';

type PlatformAdminContainerProps = {
  children: React.ReactNode;
};

export function PlatformAdminContainer({
  children,
}: PlatformAdminContainerProps) {
  const [setupOpen, setSetupOpen] = useState(false);
  const [securityOpen, setSecurityOpen] = useState(false);
  const [infrastructureOpen, setInfrastructureOpen] = useState(false);
  const { platform } = platformHooks.useCurrentPlatform();
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);
  const showPlatformAdminDashboard = useShowPlatformAdminDashboard();

  const items: SidebarItem[] = [
    {
      type: 'link',
      to: '/platform/analytics',
      label: t('Overview'),
      Icon: <LineChart />,
      locked: !platform.plan.analyticsEnabled,
      isSubItem: false,
      show: true,
    },
    {
      type: 'link',
      to: '/platform/projects',
      label: t('Projects'),
      Icon: <LayoutGrid />,
      locked: !platform.plan.manageProjectsEnabled,
      isSubItem: false,
      show: true,
    },
    {
      type: 'link',
      to: '/platform/users',
      label: t('Users'),
      Icon: <Users />,
      isSubItem: false,
      show: true,
    },
    {
      type: 'group',
      label: t('Setup'),
      Icon: <Wrench />,
      defaultOpen: false,
      open: setupOpen,
      setOpen: setSetupOpen,
      isActive: (pathname: string) => pathname.includes('/setup'),
      items: [
        {
          to: '/platform/setup/ai',
          label: t('AI'),
          show: true,
          type: 'link',
          isSubItem: true,
        },
        {
          to: '/platform/setup/branding',
          label: t('Branding'),
          show: true,
          type: 'link',
          isSubItem: true,
        },
        {
          to: '/platform/setup/connections',
          label: t('Global Connections'),
          show: true,
          type: 'link',
          isSubItem: true,
        },
        {
          to: '/platform/setup/pieces',
          label: t('Pieces'),
          show: true,
          type: 'link',
          isSubItem: true,
        },
        {
          to: '/platform/setup/templates',
          label: t('Templates'),
          show: true,
          type: 'link',
          isSubItem: true,
        },
        {
          to: '/platform/setup/billing',
          label: t('Billing'),
          show: edition !== ApEdition.COMMUNITY,
          type: 'link',
          isSubItem: true,
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
      Icon: <Shield />,
      items: [
        {
          to: '/platform/security/audit-logs',
          label: t('Audit Logs'),
          isSubItem: true,
          show: true,
          type: 'link',
        },
        {
          to: '/platform/security/sso',
          label: t('Single Sign On'),
          isSubItem: true,
          show: true,
          type: 'link',
        },
        {
          to: '/platform/security/signing-keys',
          label: t('Signing Keys'),
          isSubItem: true,
          show: true,
          type: 'link',
        },
        {
          to: '/platform/security/project-roles',
          label: t('Project Roles'),
          isSubItem: true,
          show: true,
          type: 'link',
        },
        {
          to: '/platform/security/api-keys',
          label: t('API Keys'),
          isSubItem: true,
          show: true,
          type: 'link',
        },
      ],
    },
    {
      type: 'group',
      label: t('Infrastructure'),
      Icon: <Server />,
      defaultOpen: false,
      open: infrastructureOpen,
      setOpen: setInfrastructureOpen,
      isActive: (pathname: string) => pathname.includes('/infrastructure'),
      items: [
        {
          to: '/platform/infrastructure/workers',
          label: t('Workers'),
          isSubItem: true,
          show: true,
          type: 'link',
        },
        {
          to: '/platform/infrastructure/health',
          label: t('Health'),
          isSubItem: true,
          show: true,
          type: 'link',
        },
        {
          to: '/platform/infrastructure/triggers',
          label: t('Triggers'),
          isSubItem: true,
          show: true,
          type: 'link',
        },
      ],
    },
    {
      type: 'link',
      to: '/home',
      label: t('Exit Platform Admin'),
      Icon: <ArrowLeft />,
      isSubItem: false,
      show: true,
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
