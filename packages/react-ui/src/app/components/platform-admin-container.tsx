import { t } from 'i18next';
import {
  LayoutGrid,
  LineChart,
  Server,
  Shield,
  Users,
  Wrench,
} from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { useShowPlatformAdminDashboard } from '@/hooks/authorization-hooks';
import { flagsHooks } from '@/hooks/flags-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { ApEdition, ApFlagId } from '@activepieces/shared';

import { AllowOnlyLoggedInUserOnlyGuard } from './allow-logged-in-user-only-guard';
import { SidebarComponent, SidebarGroup, SidebarItem, SidebarLink } from './sidebar';
import { useState } from 'react';

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

  const { data: showPlatformDemo } = flagsHooks.useFlag<boolean>(
    ApFlagId.SHOW_PLATFORM_DEMO,
  );

  const showPlatformAdminDashboard = useShowPlatformAdminDashboard();
  const isLocked = (locked: boolean) => locked || (showPlatformDemo ?? false);
  const items: SidebarItem[] = [
    {
      type: 'link',
      to: '/platform/analytics',
      label: t('Overview'),
      icon: LineChart,
      locked: isLocked(!platform.analyticsEnabled),
    } as SidebarLink,
    {
      type: 'link',
      to: '/platform/projects',
      label: t('Projects'),
      icon: LayoutGrid,
      locked: isLocked(!platform.manageProjectsEnabled),
    } as SidebarLink,
    {
      type: 'link',
      to: '/platform/users',
      label: t('Users'),
      icon: Users,
    } as SidebarLink,
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
        } as SidebarLink,
        {
          type: 'link',
          to: '/platform/setup/branding',
          label: t('Branding'),
        } as SidebarLink,
        {
          type: 'link',
          to: '/platform/setup/connections',
          label: t('Global Connections'),
        },
        {
          type: 'link',
          to: '/platform/setup/pieces',
          label: t('Pieces'),
        },
        {
          type: 'link',
          to: '/platform/setup/templates',
          label: t('Templates'),
        } as SidebarLink,
      ],
    } as SidebarGroup,
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
        } as SidebarLink,
        {
          type: 'link',
          to: '/platform/security/sso',
          label: t('Single Sign On'),
        } as SidebarLink,
        {
          type: 'link',
          to: '/platform/security/signing-keys',
          label: t('Signing Keys'),
        } as SidebarLink,
        { 
          type: 'link',
          to: '/platform/security/project-roles',
          label: t('Project Roles'),
        } as SidebarLink,
        {
          type: 'link',
          to: '/platform/security/api-keys',
          label: t('API Keys'),
        } as SidebarLink,
      ],
    } as SidebarGroup,
    {
      type: 'group',
      label: t('Infrastructure'),
      icon: Server,
      defaultOpen: false,
      open: infrastructureOpen,
      setOpen: setInfrastructureOpen,
      isActive: (pathname: string) => pathname.includes('/infrastructure'),
      items: [
        {
          type: 'link',
          to: '/platform/infrastructure/workers',
          label: t('Workers'),
        } as SidebarLink,
        {
          type: 'link',
          to: '/platform/infrastructure/health',
          label: t('Health'),
        } as SidebarLink,
      ],
    } as SidebarGroup,
  ];
  if (edition === ApEdition.CLOUD && !showPlatformDemo) {
    const setupGroup = items.find(item => item.type === 'group' && item.label === t('Setup')) as SidebarGroup;
    if (setupGroup) {
      setupGroup.items.push({
        type: 'link',
        to: '/platform/setup/billing',
        label: t('Billing'),
      } as SidebarLink);
    }
  }
  return (
    <AllowOnlyLoggedInUserOnlyGuard>
      {showPlatformAdminDashboard ? (
        <SidebarComponent items={items}>{children}</SidebarComponent>
      ) : (
        <Navigate to="/" />
      )}
    </AllowOnlyLoggedInUserOnlyGuard>
  );
}
