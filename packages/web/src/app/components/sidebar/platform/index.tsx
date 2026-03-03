import { ApEdition, ApFlagId, TeamProjectsLimit } from '@activepieces/shared';
import { t } from 'i18next';
import { ComponentType } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { ArrowLeftIcon } from '@/components/icons/arrow-left';
import { BotIcon } from '@/components/icons/bot';
import { FileHeartIcon } from '@/components/icons/file-heart';
import { FileJson2Icon } from '@/components/icons/file-json2';
import { KeyRoundIcon } from '@/components/icons/key-round';
import { LayoutGridIcon } from '@/components/icons/layout-grid';
import { LogInIcon } from '@/components/icons/log-in';
import { MousePointerClickIcon } from '@/components/icons/mouse-pointer-click';
import { PaletteIcon } from '@/components/icons/palette';
import { PuzzleIcon } from '@/components/icons/puzzle';
import { ReceiptIcon } from '@/components/icons/receipt';
import { ServerIcon } from '@/components/icons/server';
import { Settings2Icon } from '@/components/icons/settings2';
import { SquareDashedBottomCodeIcon } from '@/components/icons/square-dashed-bottom-code';
import { UnplugIcon } from '@/components/icons/unplug';
import { UsersIcon } from '@/components/icons/users';
import { WebhookIcon } from '@/components/icons/webhook';

import { buttonVariants } from '@/components/ui/button';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenuButton,
  SidebarGroupLabel,
  SidebarSeparator,
} from '@/components/ui/sidebar-shadcn';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { flagsHooks } from '@/hooks/flags-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { determineDefaultRoute } from '@/lib/route-utils';
import { cn } from '@/lib/utils';

import { ApSidebarItem } from '../ap-sidebar-item';
import { SidebarUser } from '../sidebar-user';

export function PlatformSidebar() {
  const navigate = useNavigate();
  const { platform } = platformHooks.useCurrentPlatform();
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);
  const { checkAccess } = useAuthorization();
  const defaultRoute = determineDefaultRoute(checkAccess);
  const branding = flagsHooks.useWebsiteBranding();
  const isEmbeddingEnabled = platform.plan.embeddingEnabled;

  const setupItems = [
    {
      to: '/platform/setup/ai',
      label: t('AI'),
      icon: BotIcon,
    },
    {
      to: '/platform/setup/branding',
      label: t('Branding'),
      icon: PaletteIcon,
      locked: !platform.plan.customAppearanceEnabled,
    },
    {
      to: '/platform/setup/connections',
      label: t('Global Connections'),
      icon: UnplugIcon,
      locked: !platform.plan.globalConnectionsEnabled,
    },
    {
      to: '/platform/setup/pieces',
      label: t('Pieces'),
      icon: PuzzleIcon,
      locked: !platform.plan.managePiecesEnabled,
    },
    {
      to: '/platform/setup/templates',
      label: t('Templates'),
      icon: LayoutGridIcon,
      locked: !platform.plan.manageTemplatesEnabled,
    },
    {
      to: '/platform/setup/billing',
      label: t('Billing'),
      icon: ReceiptIcon,
      locked: edition === ApEdition.COMMUNITY,
    },
  ].filter((item) => !(item.label === t('AI') && isEmbeddingEnabled));

  const groups: {
    label: string;
    items: {
      to: string;
      label: string;
      icon?: ComponentType<{ className?: string }>;
      locked?: boolean;
    }[];
  }[] = [
    {
      label: t('General'),
      items: [
        {
          to: '/platform/projects',
          label: t('Projects'),
          icon: LayoutGridIcon,
          locked: platform.plan.teamProjectsLimit === TeamProjectsLimit.NONE,
        },
        {
          to: '/platform/users',
          label: t('Users'),
          icon: UsersIcon,
        },
      ],
    },
    {
      label: t('Setup'),
      items: setupItems,
    },
    {
      label: t('Security'),
      items: [
        {
          to: '/platform/security/audit-logs',
          label: t('Audit Logs'),
          icon: SquareDashedBottomCodeIcon,
          locked: !platform.plan.auditLogEnabled,
        },
        {
          to: '/platform/security/sso',
          label: t('Single Sign On'),
          icon: LogInIcon,
          locked: !platform.plan.ssoEnabled,
        },
        {
          to: '/platform/security/signing-keys',
          label: t('Signing Keys'),
          icon: KeyRoundIcon,
          locked: !platform.plan.embeddingEnabled,
        },
        {
          to: '/platform/security/project-roles',
          label: t('Project Roles'),
          icon: Settings2Icon,
          locked: !platform.plan.projectRolesEnabled,
        },
        {
          to: '/platform/security/api-keys',
          label: t('API Keys'),
          icon: FileJson2Icon,
          locked: !platform.plan.apiKeysEnabled,
        },
        {
          to: '/platform/security/secret-managers',
          label: t('Secret Managers'),
          icon: KeyRoundIcon,
          locked: !platform.plan.secretManagersEnabled,
        },
      ],
    },
    {
      label: t('Infrastructure'),
      items: [
        {
          to: '/platform/infrastructure/workers',
          label: t('Workers'),
          icon: ServerIcon,
        },
        {
          to: '/platform/infrastructure/health',
          label: t('Health'),
          icon: FileHeartIcon,
        },
        {
          to: '/platform/infrastructure/triggers',
          label: t('Triggers'),
          icon: MousePointerClickIcon,
        },
        {
          to: '/platform/infrastructure/event-destinations',
          label: t('Event Streaming'),
          icon: WebhookIcon,
          locked: !platform.plan.eventStreamingEnabled,
        },
      ],
    },
  ];

  return (
    <Sidebar className="py-1 pl-1 border-r-0!">
      <SidebarHeader className="px-3">
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
          <h1 className="truncate text-sm font-medium">{branding.websiteName}</h1>
        </div>
      </SidebarHeader>
      <div className="flex-1 overflow-y-auto scrollbar-hover">
        <SidebarContent className="px-1 gap-0">
          <SidebarGroup className="cursor-default shrink-0">
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuButton
                  onClick={() => navigate('/')}
                  className="py-5 px-2"
                >
                  <ArrowLeftIcon className="size-4" />
                  {t('Exit platform admin')}
                </SidebarMenuButton>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          <SidebarSeparator className="mb-3" />
          {groups.map((group, idx) => (
            <SidebarGroup key={group.label} className="cursor-default shrink-0">
              {idx > 0 && <SidebarSeparator className="mb-3" />}
              <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
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
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </SidebarContent>
      </div>

      <SidebarFooter className="px-3">
        <SidebarUser />
      </SidebarFooter>
    </Sidebar>
  );
}
