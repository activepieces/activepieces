import { t } from 'i18next';
import {
  ArrowLeft,
  Globe,
  LayoutGrid,
  LineChart,
  Server,
  Users,
  Bot,
  Unplug,
  SquareDashedBottomCode,
  LogIn,
  KeyRound,
  FileJson2,
  Settings2,
  FileHeart,
  MousePointerClick,
} from 'lucide-react';
import { ComponentType, SVGProps } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { buttonVariants } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarHeader,
  SidebarGroup,
  SidebarMenuButton,
  SidebarGroupLabel,
} from '@/components/ui/sidebar-shadcn';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { flagsHooks } from '@/hooks/flags-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { cn, determineDefaultRoute } from '@/lib/utils';

import { ApSidebarItem } from '../ap-sidebar-item';
import { SidebarUser } from '../sidebar-user';

export function PlatformSidebar() {
  const navigate = useNavigate();
  const { platform } = platformHooks.useCurrentPlatform();
  const { checkAccess } = useAuthorization();
  const defaultRoute = determineDefaultRoute(checkAccess);
  const branding = flagsHooks.useWebsiteBranding();

  const groups: {
    label: string;
    items: {
      to: string;
      label: string;
      icon?: ComponentType<SVGProps<SVGSVGElement>>;
      locked?: boolean;
    }[];
  }[] = [
    {
      label: t('General'),
      items: [
        {
          to: '/admin/analytics',
          label: t('Overview'),
          icon: LineChart,
          locked: !platform.plan.analyticsEnabled,
        },
        {
          to: '/admin/users',
          label: t('Users'),
          icon: Users,
        },
      ],
    },
    {
      label: t('Setup'),
      items: [
        {
          to: '/admin/setup/ai',
          label: t('AI'),
          icon: Bot,
        },
        {
          to: '/admin/setup/connections',
          label: t('Global Connections'),
          icon: Unplug,
          locked: !platform.plan.globalConnectionsEnabled,
        },
        {
          to: '/admin/setup/connectors',
          label: t('Connectors'),
          icon: Unplug,
          locked: !platform.plan.globalConnectionsEnabled,
        },
        {
          to: '/admin/setup/globalconnections',
          label: t('Global Connections 2'),
          icon: Globe,
          locked: !platform.plan.globalConnectionsEnabled,
        },
        {
          to: '/admin/setup/templates',
          label: t('Templates'),
          icon: LayoutGrid,
          locked: !platform.plan.manageTemplatesEnabled,
        },
      ],
    },
    {
      label: t('Security'),
      items: [
        {
          to: '/admin/security/audit-logs',
          label: t('Audit Logs'),
          icon: SquareDashedBottomCode,
          locked: !platform.plan.auditLogEnabled,
        },
        {
          to: '/admin/security/sso',
          label: t('Single Sign On'),
          icon: LogIn,
          locked: !platform.plan.ssoEnabled,
        },
        {
          to: '/admin/security/signing-keys',
          label: t('Signing Keys'),
          icon: KeyRound,
          locked: !platform.plan.embeddingEnabled,
        },
        {
          to: '/admin/security/project-roles',
          label: t('Project Roles'),
          icon: Settings2,
          locked: !platform.plan.projectRolesEnabled,
        },
        {
          to: '/admin/security/api-keys',
          label: t('API Keys'),
          icon: FileJson2,
          locked: !platform.plan.apiKeysEnabled,
        },
      ],
    },
    {
      label: t('Infrastructure'),
      items: [
        {
          to: '/admin/infrastructure/workers',
          label: t('Workers'),
          icon: Server,
        },
        {
          to: '/admin/infrastructure/health',
          label: t('Health'),
          icon: FileHeart,
        },
        {
          to: '/admin/infrastructure/triggers',
          label: t('Triggers'),
          icon: MousePointerClick,
        },
      ],
    },
  ];

  return (
    <Sidebar className="px-4" variant="inset">
      <SidebarHeader className="px-0">
        <div className="w-full pb-2 flex items-center gap-2">
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

        <SidebarMenu>
          <SidebarMenuButton
            onClick={() => navigate('/')}
            className="py-5 px-2"
          >
            <ArrowLeft />
            {t('Exit admin')}
          </SidebarMenuButton>
        </SidebarMenu>
      </SidebarHeader>
      <ScrollArea className="h-full">
        <SidebarContent>
          {groups.map((group, idx) => (
            <SidebarGroup
              key={group.label}
              className={cn('px-0 pt-4 list-none gap-2', {
                'border-t border-gray-300 ': idx > 0,
              })}
            >
              <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
              {group.items.map((item) => (
                <ApSidebarItem
                  type="link"
                  key={item.label}
                  to={item.to}
                  label={item.label}
                  icon={item.icon}
                  locked={item.locked}
                />
              ))}
            </SidebarGroup>
          ))}
        </SidebarContent>
      </ScrollArea>

      <SidebarFooter>
        <SidebarUser />
      </SidebarFooter>
    </Sidebar>
  );
}
