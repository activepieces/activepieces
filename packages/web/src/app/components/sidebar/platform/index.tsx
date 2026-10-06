import { ApEdition, ApFlagId } from '@activepieces/shared';
import {
  AiMagicIcon,
  ArrowLeft01Icon,
  CompassIcon,
  DashboardSquare01Icon,
  FileBracesIcon,
  FileHeartIcon,
  FrameIcon,
  Key01Icon,
  Login03Icon,
  PreferenceHorizontalIcon,
  PuzzleIcon,
  ReceiptIcon,
  ServerStack01Icon,
  Settings01Icon,
  SidebarLeft01Icon,
  SidebarLeftIcon,
  SourceCodeSquareIcon,
  UnplugIcon,
  UserMultipleIcon,
} from '@hugeicons/core-free-icons';
import { t } from 'i18next';
import { Link } from 'react-router-dom';

import { McpSvg } from '@/assets/img/custom/mcp';
import { HugeiconsIcon } from '@/components/custom/hugeicons-icon';
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
  const { state, setOpen, toggleSidebar } = useSidebar();
  const collapsed = state === 'collapsed';

  const billingLocked = edition === ApEdition.COMMUNITY;
  const groups: { label: string; items: PlatformNavItem[] }[] = [
    {
      label: t('Organization'),
      items: [
        {
          to: '/platform/projects',
          label: t('Projects'),
          icon: DashboardSquare01Icon,
        },
        {
          to: '/platform/users',
          label: t('People'),
          icon: UserMultipleIcon,
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
      ],
    },
    {
      label: t('Building'),
      items: [
        {
          to: '/platform/pieces',
          label: t('Pieces'),
          icon: PuzzleIcon,
          subItems: [
            { to: '/platform/pieces', label: t('Catalog'), end: true },
            {
              to: '/platform/pieces/policies',
              label: t('Policies'),
              locked: !platform.plan.managePiecesEnabled,
              tier: PLATFORM_FEATURES.pieces.tier,
            },
          ],
        },
        {
          to: '/platform/connections',
          label: t('Connections'),
          icon: UnplugIcon,
        },
        {
          to: '/platform/ai',
          label: t('AI providers'),
          icon: AiMagicIcon,
          locked: !platform.plan.aiProvidersEnabled,
          tier: PLATFORM_FEATURES.aiProviders.tier,
        },
        {
          to: '/platform/templates',
          label: t('Templates'),
          icon: CompassIcon,
          locked: !platform.plan.manageTemplatesEnabled,
          tier: PLATFORM_FEATURES.templates.tier,
        },
      ],
    },
    {
      label: t('Operations'),
      items: [
        {
          to: '/platform/health',
          label: t('Health'),
          icon: FileHeartIcon,
          subItems: [
            { to: '/platform/health', label: t('Overview'), end: true },
            {
              to: '/platform/health/runs',
              label: t('Runs'),
              keepSearch: ['month'],
            },
            {
              to: '/platform/health/queue',
              label: t('Queue'),
              keepSearch: ['month'],
            },
            { to: '/platform/health/triggers', label: t('Triggers') },
          ],
        },
        {
          to: '/platform/workers',
          label: t('Workers'),
          icon: ServerStack01Icon,
          subItems: [
            { to: '/platform/workers', label: t('Machines'), end: true },
            {
              to: '/platform/workers/groups',
              label: t('Groups'),
              locked: !platform.plan.workerGroupsEnabled,
              tier: PLATFORM_FEATURES.workerGroups.tier,
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
          label: t('Single sign-on'),
          icon: Login03Icon,
          locked: !platform.plan.ssoEnabled,
          tier: PLATFORM_FEATURES.sso.tier,
        },
        {
          to: '/platform/secret-managers',
          label: t('Secret managers'),
          icon: Key01Icon,
          locked: !platform.plan.secretManagersEnabled,
          tier: PLATFORM_FEATURES.secretManagers.tier,
        },
        {
          to: '/platform/audit-log',
          label: t('Audit log'),
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
              label: t('Streaming'),
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
          to: '/platform/mcp',
          label: t('MCP server'),
          icon: McpSvg,
          subItems: [
            { to: '/platform/mcp', label: t('Tools'), end: true },
            { to: '/platform/mcp/activity', label: t('Activity') },
          ],
        },
        {
          to: '/platform/api-keys',
          label: t('API keys'),
          icon: FileBracesIcon,
          locked: !platform.plan.apiKeysEnabled,
          tier: PLATFORM_FEATURES.apiKeys.tier,
        },
        {
          to: '/platform/embedding',
          label: t('Embed SDK'),
          icon: FrameIcon,
          locked: !platform.plan.embeddingEnabled,
          tier: PLATFORM_FEATURES.embedding.tier,
        },
      ],
    },
    {
      label: t('Settings'),
      items: [
        { to: '/platform/general', label: t('General'), icon: Settings01Icon },
        ...(edition === ApEdition.CLOUD
          ? []
          : [
              {
                to: '/platform/configurations',
                label: t('Configurations'),
                icon: PreferenceHorizontalIcon,
              },
            ]),
        {
          to: '/platform/billing',
          label: t('Billing'),
          icon: ReceiptIcon,
          subItems: [
            {
              to: '/platform/billing',
              label: t('Plan'),
              end: true,
              locked: billingLocked,
              alsoActiveOn: [
                '/platform/billing/success',
                '/platform/billing/error',
              ],
            },
            {
              to: '/platform/billing/usage',
              label: t('Usage'),
              locked: billingLocked,
            },
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
        <SidebarMenu className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link to={defaultRoute}>
                <HugeiconsIcon icon={ArrowLeft01Icon} size={16} />
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
              {collapsed ? (
                <HugeiconsIcon icon={SidebarLeftIcon} />
              ) : (
                <HugeiconsIcon icon={SidebarLeft01Icon} />
              )}
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
