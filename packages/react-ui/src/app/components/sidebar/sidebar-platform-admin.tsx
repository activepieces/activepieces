import { t } from 'i18next';
import {
  ArrowLeft,
  ChevronRight,
  LayoutGrid,
  LineChart,
  Lock,
  Server,
  Shield,
  Users,
  Wrench,
} from 'lucide-react';
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenuSubButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar-shadcn';
import { flagsHooks } from '@/hooks/flags-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { ApEdition, ApFlagId } from '@activepieces/shared';
import { ApDashboardSidebarHeader } from './ap-sidebar-header';
import { SidebarUser } from './sidebar-user';
import { SidebarPlatformAdminButton } from './sidebar-platform-admin-button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

export function PlatformAdminSidebar() {
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);
  const { platform } = platformHooks.useCurrentPlatform();
  const location = useLocation();
  const navigate = useNavigate();

  const [setupOpen, setSetupOpen] = useState(false);
  const [securityOpen, setSecurityOpen] = useState(false);
  const [infrastructureOpen, setInfrastructureOpen] = useState(false);

  const items = [
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
  ];


  return (
    <Sidebar className="h-screen min-w-[250px]" collapsible="none">
      <SidebarHeader>
        <ApDashboardSidebarHeader isHomeDashboard={false} />
        <SidebarMenu>
          {items.map((item) => {
            if (item.type === 'link') {
              const isActive = location.pathname.includes(item.to || '');
              return (
                <SidebarMenuItem key={item.to}>
                  <SidebarMenuButton
                    onClick={() => navigate(item.to || '')}
                    isActive={isActive}
                  >
                    <>
                      {item.Icon}
                      <span className="flex-grow">{item.label}</span>
                      {item.locked && <Lock className="!size-4 ml-auto text-muted-foreground" />}
                    </>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            }

            if (item.type === 'group') {
              const isActive = item.isActive?.(location.pathname) || false;
              return (
                <Collapsible
                  key={item.label}
                  asChild
                  defaultOpen={isActive}
                  className="group/collapsible"
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton tooltip={item.label}>
                        {item.Icon}
                        <span>{item.label}</span>
                        <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item.items?.map((subItem) => {
                          const isActive = location.pathname.includes(subItem.to || '');
                          return (
                            <SidebarMenuSubItem key={subItem.to} >
                              <SidebarMenuSubButton asChild onClick={() => navigate(subItem.to)} isActive={isActive}>
                                <span>{subItem.label}</span>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          );
                        })}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              );
            }

            return null;
          })}
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
      </SidebarContent>
      <SidebarFooter>
        <SidebarPlatformAdminButton />
        <SidebarUser />
      </SidebarFooter>
    </Sidebar>
  );
} 