import { t } from 'i18next';
import {
  ArrowLeft,
  Palette,
  LayoutGrid,
  LineChart,
  Server,
  Users,
  Bot,
  Unplug,
  Puzzle,
  Receipt,
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
import { ApEdition, ApFlagId, TeamProjectsLimit } from '@activepieces/shared';

import { ApSidebarItem } from '../ap-sidebar-item';
import { SidebarUser } from '../sidebar-user';

export function PlatformSidebar() {
  const navigate = useNavigate();
  const { platform } = platformHooks.useCurrentPlatform();
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);
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
          to: '/platform/analytics',
          label: t('Overview'),
          icon: LineChart,
          locked: !platform.plan.analyticsEnabled,
        },
        {
          to: '/platform/projects',
          label: t('Projects'),
          icon: LayoutGrid,
          locked: platform.plan.teamProjectsLimit === TeamProjectsLimit.NONE,
        },
        {
          to: '/platform/users',
          label: t('Users'),
          icon: Users,
        },
      ],
    },
    {
      label: t('Setup'),
      items: [
        {
          to: '/platform/setup/ai',
          label: t('AI'),
          icon: Bot,
        },
        {
          to: '/platform/setup/branding',
          label: t('Branding'),
          icon: Palette,
          locked: !platform.plan.customAppearanceEnabled,
        },
        {
          to: '/platform/setup/connections',
          label: t('Global Connections'),
          icon: Unplug,
          locked: !platform.plan.globalConnectionsEnabled,
        },
        {
          to: '/platform/setup/pieces',
          label: t('Pieces'),
          icon: Puzzle,
          locked: !platform.plan.managePiecesEnabled,
        },
        {
          to: '/platform/setup/templates',
          label: t('Templates'),
          icon: LayoutGrid,
          locked: !platform.plan.manageTemplatesEnabled,
        },
        {
          to: '/platform/setup/billing',
          label: t('Billing'),
          icon: Receipt,
          locked: edition === ApEdition.COMMUNITY,
        },
      ],
    },
    {
      label: t('Security'),
      items: [
        {
          to: '/platform/security/audit-logs',
          label: t('Audit Logs'),
          icon: SquareDashedBottomCode,
          locked: !platform.plan.auditLogEnabled,
        },
        {
          to: '/platform/security/sso',
          label: t('Single Sign On'),
          icon: LogIn,
          locked: !platform.plan.ssoEnabled,
        },
        {
          to: '/platform/security/signing-keys',
          label: t('Signing Keys'),
          icon: KeyRound,
          locked: !platform.plan.embeddingEnabled,
        },
        {
          to: '/platform/security/project-roles',
          label: t('Project Roles'),
          icon: Settings2,
          locked: !platform.plan.projectRolesEnabled,
        },
        {
          to: '/platform/security/api-keys',
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
          to: '/platform/infrastructure/workers',
          label: t('Workers'),
          icon: Server,
        },
        {
          to: '/platform/infrastructure/health',
          label: t('Health'),
          icon: FileHeart,
        },
        {
          to: '/platform/infrastructure/triggers',
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
            {t('Exit platform admin')}
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
