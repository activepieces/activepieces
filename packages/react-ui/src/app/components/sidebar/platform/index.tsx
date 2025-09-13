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
import { Link, useNavigate } from 'react-router-dom';

import { buttonVariants } from '@/components/ui/button';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarHeader,
  SidebarGroup,
  SidebarMenuButton,
} from '@/components/ui/sidebar-shadcn';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { flagsHooks } from '@/hooks/flags-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { cn, determineDefaultRoute } from '@/lib/utils';
import { ApEdition, ApFlagId } from '@activepieces/shared';

import { ApSidebareGroup, SidebarGeneralItemType } from '../ap-sidebar-group';
import { ApSidebarItem } from '../ap-sidebar-item';
import { SidebarUser } from '../sidebar-user';

export function PlatformSidebar() {
  const [setupOpen, setSetupOpen] = useState(false);
  const [securityOpen, setSecurityOpen] = useState(false);
  const [infrastructureOpen, setInfrastructureOpen] = useState(false);
  const navigate = useNavigate();
  const { platform } = platformHooks.useCurrentPlatform();
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);
  const { checkAccess } = useAuthorization();
  const defaultRoute = determineDefaultRoute(checkAccess);
  const branding = flagsHooks.useWebsiteBranding();

  const items: SidebarGeneralItemType[] = [
    {
      type: 'link',
      to: '/platform/analytics',
      label: t('Overview'),
      icon: LineChart,
      locked: !platform.plan.analyticsEnabled,
      isSubItem: false,
      show: true,
    },
    {
      type: 'link',
      to: '/platform/projects',
      label: t('Projects'),
      icon: LayoutGrid,
      locked: !platform.plan.manageProjectsEnabled,
      isSubItem: false,
      show: true,
    },
    {
      type: 'link',
      to: '/platform/users',
      label: t('Users'),
      icon: Users,
      isSubItem: false,
      show: true,
    },
    {
      type: 'group',
      label: t('Setup'),
      icon: Wrench,
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
          to: '/platform/setup/branding',
          label: t('Branding'),
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
        {
          type: 'link',
          to: '/platform/security/api-keys',
          label: t('API Keys'),
          isSubItem: true,
          show: true,
        },
      ],
    },
    {
      type: 'group',
      label: t('Infrastructure'),
      icon: Server,
      open: infrastructureOpen,
      setOpen: setInfrastructureOpen,
      isActive: (pathname: string) => pathname.includes('/infrastructure'),
      items: [
        {
          type: 'link',
          to: '/platform/infrastructure/workers',
          label: t('Workers'),
          isSubItem: true,
          show: true,
        },
        {
          type: 'link',
          to: '/platform/infrastructure/jobs',
          label: t('Jobs'),
          isSubItem: true,
          show: true,
        },
        {
          type: 'link',
          to: '/platform/infrastructure/health',
          label: t('Health'),
          isSubItem: true,
          show: true,
        },
        {
          type: 'link',
          to: '/platform/infrastructure/triggers',
          label: t('Triggers'),
          isSubItem: true,
          show: true,
        },
      ],
    },
  ];

  return (
    <Sidebar variant="inset">
      <SidebarHeader>
        <div className="w-full py-2 flex items-center gap-2">
          <Link
            to={defaultRoute}
            className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }))}
          >
            <img
              src={branding.logos.logoIconUrl}
              alt={t('home')}
              className="h-5 w-5 object-contain"
            />
          </Link>
          <h1 className="truncate font-semibold">{branding.websiteName}</h1>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {items.map((item) =>
              item.type === 'group' ? (
                <ApSidebareGroup key={item.label} {...item} />
              ) : (
                <ApSidebarItem key={item.label} {...item} />
              ),
            )}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuButton
            onClick={() => navigate('/')}
            className="py-5 px-2"
          >
            <ArrowLeft />
            {t('Exit platform admin')}
          </SidebarMenuButton>
        </SidebarMenu>
        <SidebarUser />
      </SidebarFooter>
    </Sidebar>
  );
}
