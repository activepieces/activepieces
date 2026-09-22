import { ApEdition, ApFlagId } from '@activepieces/shared';
import { t } from 'i18next';
import { useRef } from 'react';
import { Link } from 'react-router-dom';

import { McpSvg } from '@/assets/img/custom/mcp';
import { ChartLineIcon } from '@/components/icons/chart-line';
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
import { PuzzleIcon } from '@/components/icons/puzzle';
import { ReceiptIcon } from '@/components/icons/receipt';
import { ServerIcon } from '@/components/icons/server';
import { SettingsIcon } from '@/components/icons/settings';
import { Settings2Icon } from '@/components/icons/settings2';
import { SparklesIcon } from '@/components/icons/sparkles';
import { SquareDashedBottomCodeIcon } from '@/components/icons/square-dashed-bottom-code';
import { UnplugIcon } from '@/components/icons/unplug';
import { UsersIcon } from '@/components/icons/users';
import { WebhookIcon } from '@/components/icons/webhook';
import { buttonVariants } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
} from '@/components/ui/sidebar-shadcn';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { flagsHooks } from '@/hooks/flags-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { determineDefaultRoute } from '@/lib/route-utils';
import { cn } from '@/lib/utils';

import { ApSidebarItem, SidebarItemType } from '../ap-sidebar-item';
import { SidebarUser } from '../sidebar-user';

export function PlatformSidebar() {
  const { platform } = platformHooks.useCurrentPlatform();
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);
  const { checkAccess } = useAuthorization();
  const defaultRoute = determineDefaultRoute({
    checkAccess,
    chatEnabled: platform.plan.chatEnabled,
  });
  const chevronRef = useRef<ChevronLeftIconHandle>(null);

  const setupItems: PlatformNavItem[] = [
    {
      to: '/platform/setup/general',
      label: t('General'),
      icon: SettingsIcon,
    },
    {
      to: '/platform/setup/ai',
      label: t('AI Center'),
      icon: SparklesIcon,
      subItems:
        edition === ApEdition.COMMUNITY
          ? undefined
          : [
              { to: '/platform/setup/ai', label: t('Providers'), end: true },
              {
                to: '/platform/setup/ai/capabilities',
                label: t('Capabilities'),
              },
            ],
    },
    {
      to: '/platform/setup/mcp',
      label: t('MCP Server'),
      icon: McpSvg,
      subItems: [
        { to: '/platform/setup/mcp', label: t('Connection'), end: true },
        { to: '/platform/setup/mcp/tools', label: t('Tools') },
        { to: '/platform/setup/mcp/activity', label: t('Activity') },
      ],
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
      subItems: [
        { to: '/platform/setup/pieces', label: t('Pieces'), end: true },
        { to: '/platform/setup/pieces/piece-sets', label: t('Piece Sets') },
      ],
    },
    {
      to: '/platform/setup/templates',
      label: t('Templates'),
      icon: LayoutGridIcon,
      locked: !platform.plan.manageTemplatesEnabled,
    },
    {
      to: '/platform/setup/billing',
      label: t('Billing & subscription'),
      icon: ReceiptIcon,
      locked: edition === ApEdition.COMMUNITY,
    },
    {
      to: '/platform/setup/usage',
      label: t('Usage'),
      icon: ChartLineIcon,
      locked: edition === ApEdition.COMMUNITY,
    },
    {
      to: '/platform/security/embed',
      label: t('Embedding'),
      icon: FrameIcon,
      locked: !platform.plan.embeddingEnabled,
    },
  ];

  const groups: { label: string; items: PlatformNavItem[] }[] = [
    {
      label: t('General'),
      items: [
        {
          to: '/platform/projects',
          label: t('Projects'),
          icon: LayoutGridIcon,
          locked: platform.plan.billedTeamProjectsLimit === 0,
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
          subItems: [
            {
              to: '/platform/infrastructure/workers',
              label: t('Health'),
              end: true,
            },
            {
              to: '/platform/infrastructure/workers/groups',
              label: t('Worker groups'),
              locked: !platform.plan.workerGroupsEnabled,
            },
          ],
        },
        {
          to: '/platform/infrastructure/health',
          label: t('Health'),
          icon: FileHeartIcon,
          subItems: [
            {
              to: '/platform/infrastructure/health',
              label: t('System Health'),
              end: true,
            },
            {
              to: '/platform/infrastructure/health/runs',
              label: t('Runs Health'),
            },
            {
              to: '/platform/infrastructure/health/queue',
              label: t('Queue Health'),
            },
          ],
        },
        {
          to: '/platform/infrastructure/triggers',
          label: t('Triggers'),
          icon: MousePointerClickIcon,
        },
        ...(edition === ApEdition.CLOUD
          ? []
          : [
              {
                to: '/platform/infrastructure/configurations',
                label: t('Configurations'),
                icon: Settings2Icon,
              },
            ]),
      ],
    },
  ];

  return (
    <Sidebar className="border-r-0!">
      <SidebarHeader className="px-3 pb-0">
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
      <SidebarContent className="gap-0 overflow-hidden">
        <ScrollArea
          type="hover"
          className="min-h-0 flex-1"
          scrollBarClassName="py-1 pr-0.5"
          showGradient
          gradientClassName="h-12"
        >
          {groups.map((group, idx) => (
            <SidebarGroup
              key={group.label}
              className={cn(
                'cursor-default shrink-0 px-3 py-0',
                idx > 0 && 'mt-4',
              )}
            >
              <SidebarGroupLabel className="h-8 text-sm">
                {group.label}
              </SidebarGroupLabel>
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
                      subItems={item.subItems}
                    />
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </ScrollArea>
      </SidebarContent>

      <SidebarFooter className="px-3 pb-3">
        <SidebarUser />
      </SidebarFooter>
    </Sidebar>
  );
}

type PlatformNavItem = Pick<
  SidebarItemType,
  'to' | 'label' | 'icon' | 'locked' | 'subItems'
>;
