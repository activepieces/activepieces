import { ApEdition, ApFlagId } from '@activepieces/shared';
import { t } from 'i18next';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useRef } from 'react';
import { Link } from 'react-router-dom';

import { McpSvg } from '@/assets/img/custom/mcp';
import {
  ChevronLeftIcon,
  ChevronLeftIconHandle,
} from '@/components/icons/chevron-left';
import { CompassIcon } from '@/components/icons/compass';
import { FileHeartIcon } from '@/components/icons/file-heart';
import { FileJson2Icon } from '@/components/icons/file-json2';
import { FrameIcon } from '@/components/icons/frame';
import { KeyRoundIcon } from '@/components/icons/key-round';
import { LayoutGridIcon } from '@/components/icons/layout-grid';
import { LogInIcon } from '@/components/icons/log-in';
import { PuzzleIcon } from '@/components/icons/puzzle';
import { ReceiptIcon } from '@/components/icons/receipt';
import { ServerIcon } from '@/components/icons/server';
import { SettingsIcon } from '@/components/icons/settings';
import { SparklesIcon } from '@/components/icons/sparkles';
import { SquareDashedBottomCodeIcon } from '@/components/icons/square-dashed-bottom-code';
import { UnplugIcon } from '@/components/icons/unplug';
import { UsersIcon } from '@/components/icons/users';
import { Button } from '@/components/ui/button';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { PLATFORM_FEATURES } from '@/features/billing';
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
  const { state, setOpen, toggleSidebar } = useSidebar();
  const collapsed = state === 'collapsed';

  const groups: { label: string; items: PlatformNavItem[] }[] = [
    {
      label: t('Platform'),
      items: [
        {
          to: '/platform/projects',
          label: t('Projects'),
          icon: LayoutGridIcon,
        },
        {
          to: '/platform/users',
          label: t('Users'),
          icon: UsersIcon,
          subItems: [
            { to: '/platform/users', label: t('Users'), end: true },
            {
              to: '/platform/users/roles',
              label: t('Roles'),
              locked: !platform.plan.projectRolesEnabled,
              tier: PLATFORM_FEATURES.projectRoles.tier,
            },
          ],
        },
        {
          to: '/platform/connections',
          label: t('Connections'),
          icon: UnplugIcon,
        },
      ],
    },
    {
      label: t('Catalogue'),
      items: [
        {
          to: '/platform/pieces',
          label: t('Pieces'),
          icon: PuzzleIcon,
          subItems: [
            { to: '/platform/pieces', label: t('Pieces'), end: true },
            {
              to: '/platform/pieces/piece-sets',
              label: t('Piece sets'),
              locked: !platform.plan.managePiecesEnabled,
              tier: PLATFORM_FEATURES.pieces.tier,
            },
          ],
        },
        {
          to: '/platform/templates',
          label: t('Templates'),
          icon: CompassIcon,
          locked: !platform.plan.manageTemplatesEnabled,
          tier: PLATFORM_FEATURES.templates.tier,
        },
        {
          to: '/platform/ai',
          label: t('AI'),
          icon: SparklesIcon,
          locked: !platform.plan.aiProvidersEnabled,
          tier: PLATFORM_FEATURES.aiProviders.tier,
        },
      ],
    },
    {
      label: t('Security'),
      items: [
        {
          to: '/platform/sso',
          label: t('Single sign-on'),
          icon: LogInIcon,
          locked: !platform.plan.ssoEnabled,
          tier: PLATFORM_FEATURES.sso.tier,
        },
        {
          to: '/platform/secret-managers',
          label: t('Secret managers'),
          icon: KeyRoundIcon,
          locked: !platform.plan.secretManagersEnabled,
          tier: PLATFORM_FEATURES.secretManagers.tier,
        },
        {
          to: '/platform/audit-log',
          label: t('Audit log'),
          icon: SquareDashedBottomCodeIcon,
          subItems: [
            {
              to: '/platform/audit-log',
              label: t('Events'),
              end: true,
              locked: !platform.plan.auditLogEnabled,
              tier: PLATFORM_FEATURES.auditLogs.tier,
            },
            {
              to: '/platform/audit-log/streaming',
              label: t('Event streaming'),
              locked: !platform.plan.eventStreamingEnabled,
              tier: PLATFORM_FEATURES.eventStreaming.tier,
            },
          ],
        },
      ],
    },
    {
      label: t('Developers'),
      items: [
        {
          to: '/platform/api-keys',
          label: t('API keys'),
          icon: FileJson2Icon,
          locked: !platform.plan.apiKeysEnabled,
          tier: PLATFORM_FEATURES.apiKeys.tier,
        },
        {
          to: '/platform/embedding',
          label: t('Embedding'),
          icon: FrameIcon,
          locked: !platform.plan.embeddingEnabled,
          tier: PLATFORM_FEATURES.embedding.tier,
        },
        {
          to: '/platform/mcp',
          label: t('MCP server'),
          icon: McpSvg,
          subItems: [
            { to: '/platform/mcp', label: t('Tools'), end: true },
            { to: '/platform/mcp/activity', label: t('Activity') },
          ],
        },
      ],
    },
    {
      label: t('Operations'),
      items: [
        {
          to: '/platform/workers',
          label: t('Workers'),
          icon: ServerIcon,
          subItems: [
            { to: '/platform/workers', label: t('Machines'), end: true },
            {
              to: '/platform/workers/groups',
              label: t('Groups'),
              locked: !platform.plan.workerGroupsEnabled,
            },
          ],
        },
        {
          to: '/platform/health',
          label: t('Health'),
          icon: FileHeartIcon,
          subItems: [
            { to: '/platform/health', label: t('System'), end: true },
            { to: '/platform/health/runs', label: t('Runs') },
            { to: '/platform/health/queue', label: t('Queue') },
            { to: '/platform/health/triggers', label: t('Triggers') },
          ],
        },
      ],
    },
    {
      label: t('Account'),
      items: [
        { to: '/platform/general', label: t('General'), icon: SettingsIcon },
        {
          to: '/platform/billing',
          label: t('Billing'),
          icon: ReceiptIcon,
          locked: edition === ApEdition.COMMUNITY,
          subItems: [
            { to: '/platform/billing', label: t('Plan'), end: true },
            { to: '/platform/billing/usage', label: t('Usage') },
          ],
        },
      ],
    },
  ];

  return (
    <Sidebar
      collapsible="icon"
      onClick={
        collapsed
          ? (event) => {
              if (
                event.target instanceof Element &&
                event.target.closest('a,button')
              ) {
                return;
              }
              setOpen(true);
            }
          : undefined
      }
      className={cn(collapsed && 'cursor-ew-resize')}
    >
      <SidebarHeader className="flex-row items-center gap-1 group-data-[collapsible=icon]:flex-col">
        <SidebarMenu className="min-w-0 flex-1">
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip={t('Back to app')}>
              <Link
                to={defaultRoute}
                onMouseEnter={() => chevronRef.current?.startAnimation()}
                onMouseLeave={() => chevronRef.current?.stopAnimation()}
              >
                <ChevronLeftIcon ref={chevronRef} size={16} />
                <span>{t('Back to app')}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-gray-11"
              onClick={toggleSidebar}
              aria-label={collapsed ? t('Open sidebar') : t('Close sidebar')}
            >
              {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            {collapsed ? t('Open sidebar') : t('Close sidebar')}
          </TooltipContent>
        </Tooltip>
      </SidebarHeader>
      <SidebarContent className="gap-0">
        {groups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <ApSidebarItem
                    type="link"
                    key={item.to}
                    to={item.to}
                    label={item.label}
                    icon={item.icon}
                    locked={item.locked}
                    tier={item.tier}
                    subItems={item.subItems}
                  />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter>
        <SidebarUser />
      </SidebarFooter>
    </Sidebar>
  );
}

type PlatformNavItem = Pick<
  SidebarItemType,
  'to' | 'label' | 'icon' | 'locked' | 'tier' | 'subItems'
>;
