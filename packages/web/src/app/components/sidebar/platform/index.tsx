import { ApEdition, ApFlagId, TeamProjectsLimit } from '@activepieces/shared';
import { t } from 'i18next';
import { ComponentType, useRef } from 'react';
import { Link } from 'react-router-dom';

import { McpSvg } from '@/assets/img/custom/mcp';
import { BotIcon } from '@/components/icons/bot';
import {
  ChevronLeftIcon,
  ChevronLeftIconHandle,
} from '@/components/icons/chevron-left';
import { FileHeartIcon } from '@/components/icons/file-heart';
import { FileJson2Icon } from '@/components/icons/file-json2';
import { FrameIcon } from '@/components/icons/frame';
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
  const { platform } = platformHooks.useCurrentPlatform();
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);
  const { checkAccess } = useAuthorization();
  const defaultRoute = determineDefaultRoute(checkAccess);
  const chevronRef = useRef<ChevronLeftIconHandle>(null);

  const setupItems = [
    {
      to: '/platform/setup/ai',
      label: t('AI Providers'),
      icon: BotIcon,
    },
    {
      to: '/platform/setup/mcp',
      label: t('MCP Server'),
      icon: McpSvg,
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
    {
      to: '/platform/security/signing-keys',
      label: t('Embedding'),
      icon: FrameIcon,
      locked: !platform.plan.embeddingEnabled,
    },
  ];

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
        {
          to: '/platform/connections',
          label: t('Connections'),
          icon: UnplugIcon,
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
          to: '/platform/security/sso',
          label: t('Single Sign On'),
          icon: LogInIcon,
          locked: !platform.plan.ssoEnabled,
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
      label: t('Observability'),
      items: [
        {
          to: '/platform/security/audit-logs',
          label: t('Audit Logs'),
          icon: SquareDashedBottomCodeIcon,
          locked: !platform.plan.auditLogEnabled,
        },
        {
          to: '/platform/infrastructure/event-destinations',
          label: t('Event Streaming'),
          icon: WebhookIcon,
          locked: !platform.plan.eventStreamingEnabled,
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
      ],
    },
  ];

  return (
    <Sidebar className="border-r-0!">
      <SidebarHeader className="pb-0">
        <Link
          to={defaultRoute}
          className={cn(
            buttonVariants({ variant: 'ghost' }),
            'w-full justify-start gap-2 px-2',
          )}
          onMouseEnter={() => chevronRef.current?.startAnimation()}
          onMouseLeave={() => chevronRef.current?.stopAnimation()}
        >
          <ChevronLeftIcon ref={chevronRef} className="size-4" size={16} />
          <span className="truncate text-sm">{t('Back to app')}</span>
        </Link>
      </SidebarHeader>
      <div className="flex-1 overflow-y-auto">
        <SidebarContent className="gap-0">
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

      <SidebarFooter>
        <SidebarUser />
      </SidebarFooter>
    </Sidebar>
  );
}
