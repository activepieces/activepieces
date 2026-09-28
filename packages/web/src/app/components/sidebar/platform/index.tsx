import { ApEdition, ApFlagId } from '@activepieces/shared';
import {
  AiMagicIcon,
  ArrowLeft01Icon,
  ChartLineData02Icon,
  DashboardSquare01Icon,
  FileBracesIcon,
  FileHeartIcon,
  FrameIcon,
  Key01Icon,
  Login03Icon,
  MousePointerClickIcon,
  PreferenceHorizontalIcon,
  PuzzleIcon,
  ReceiptIcon,
  ServerStack01Icon,
  Settings01Icon,
  SourceCodeSquareIcon,
  UnplugIcon,
  UserMultipleIcon,
} from '@hugeicons/core-free-icons';
import { t } from 'i18next';
import { Link } from 'react-router-dom';

import { McpSvg } from '@/assets/img/custom/mcp';
import { HugeiconsIcon } from '@/components/custom/hugeicons-icon';
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

  const groups: { label: string; items: PlatformNavItem[] }[] = [
    {
      label: t('Platform'),
      items: [
        {
          to: '/platform/projects',
          label: t('Projects'),
          icon: DashboardSquare01Icon,
        },
        {
          to: '/platform/users',
          label: t('Users'),
          icon: UserMultipleIcon,
          subItems: [
            { to: '/platform/users', label: t('Members'), end: true },
            {
              to: '/platform/users/roles',
              label: t('Roles & Access'),
              locked: !platform.plan.projectRolesEnabled,
              tier: PLATFORM_FEATURES.projectRoles.tier,
            },
          ],
        },
        {
          to: '/platform/connections',
          label: t('Connections'),
          icon: UnplugIcon,
          subItems: [
            { to: '/platform/connections', label: t('All'), end: true },
            {
              to: '/platform/connections/global',
              label: t('Global Connections'),
              locked: !platform.plan.globalConnectionsEnabled,
              tier: PLATFORM_FEATURES.globalConnections.tier,
            },
          ],
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
              label: t('Piece Sets'),
              locked: !platform.plan.managePiecesEnabled,
              tier: PLATFORM_FEATURES.pieces.tier,
            },
          ],
        },
        {
          to: '/platform/templates',
          label: t('Templates'),
          icon: DashboardSquare01Icon,
          locked: !platform.plan.manageTemplatesEnabled,
          tier: PLATFORM_FEATURES.templates.tier,
        },
        {
          to: '/platform/ai',
          label: t('AI Center'),
          icon: AiMagicIcon,
          subItems:
            edition === ApEdition.COMMUNITY
              ? undefined
              : [
                  { to: '/platform/ai', label: t('Providers'), end: true },
                  {
                    to: '/platform/ai/capabilities',
                    label: t('Capabilities'),
                  },
                ],
        },
      ],
    },
    {
      label: t('Security'),
      items: [
        {
          to: '/platform/sso',
          label: t('Single Sign On'),
          icon: Login03Icon,
          locked: !platform.plan.ssoEnabled,
          tier: PLATFORM_FEATURES.sso.tier,
        },
        {
          to: '/platform/secret-managers',
          label: t('Secret Managers'),
          icon: Key01Icon,
          locked: !platform.plan.secretManagersEnabled,
          tier: PLATFORM_FEATURES.secretManagers.tier,
        },
        {
          to: '/platform/audit-log',
          label: t('Audit Logs'),
          icon: SourceCodeSquareIcon,
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
              label: t('Event Streaming'),
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
          label: t('API Keys'),
          icon: FileBracesIcon,
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
          label: t('MCP Server'),
          icon: McpSvg,
          subItems: [
            { to: '/platform/mcp', label: t('Connection'), end: true },
            { to: '/platform/mcp/tools', label: t('Tools') },
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
          icon: ServerStack01Icon,
          subItems: [
            {
              to: '/platform/workers',
              label: t('Health'),
              end: true,
            },
            {
              to: '/platform/workers/groups',
              label: t('Worker groups'),
              locked: !platform.plan.workerGroupsEnabled,
            },
          ],
        },
        {
          to: '/platform/health',
          label: t('Health'),
          icon: FileHeartIcon,
          subItems: [
            {
              to: '/platform/health',
              label: t('System Health'),
              end: true,
            },
            {
              to: '/platform/health/runs',
              label: t('Runs Health'),
            },
            {
              to: '/platform/health/queue',
              label: t('Queue Health'),
            },
          ],
        },
        {
          to: '/platform/triggers',
          label: t('Triggers'),
          icon: MousePointerClickIcon,
        },
      ],
    },
    {
      label: t('Account'),
      items: [
        {
          to: '/platform/general',
          label: t('General'),
          icon: Settings01Icon,
        },
        {
          to: '/platform/billing',
          label: t('Billing & subscription'),
          icon: ReceiptIcon,
          locked: edition === ApEdition.COMMUNITY,
        },
        {
          to: '/platform/usage',
          label: t('Usage'),
          icon: ChartLineData02Icon,
          locked: edition === ApEdition.COMMUNITY,
        },
        ...(edition === ApEdition.CLOUD
          ? []
          : [
              {
                to: '/platform/configurations',
                label: t('Configurations'),
                icon: PreferenceHorizontalIcon,
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
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" />
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
  'to' | 'label' | 'icon' | 'locked' | 'tier' | 'subItems'
>;
