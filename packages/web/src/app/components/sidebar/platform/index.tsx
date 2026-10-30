import { ApEdition, ApFlagId } from '@activepieces/shared';
import { t } from 'i18next';

import { McpSvg } from '@/assets/img/custom/mcp';
import { ChartLineIcon } from '@/components/icons/chart-line';
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
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
} from '@/components/ui/sidebar-shadcn';
import { PLATFORM_FEATURES } from '@/features/billing';
import { flagsHooks } from '@/hooks/flags-hooks';
import { platformHooks } from '@/hooks/platform-hooks';

import { ApSidebarItem, SidebarItemType } from '../ap-sidebar-item';

export function PlatformNav() {
  const { platform } = platformHooks.useCurrentPlatform();
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);

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
            { to: '/platform/users', label: t('Members'), end: true },
            {
              to: '/platform/users/roles',
              label: t('Roles & Access'),
              locked: !platform.plan.projectRolesEnabled,
              featureKey: PLATFORM_FEATURES.projectRoles.featureKey,
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
              featureKey: PLATFORM_FEATURES.globalConnections.featureKey,
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
              featureKey: PLATFORM_FEATURES.pieces.featureKey,
            },
          ],
        },
        {
          to: '/platform/templates',
          label: t('Templates'),
          icon: LayoutGridIcon,
          locked: !platform.plan.manageTemplatesEnabled,
          featureKey: PLATFORM_FEATURES.templates.featureKey,
        },
        {
          to: '/platform/ai',
          label: t('AI Center'),
          icon: SparklesIcon,
          locked: !platform.plan.aiProvidersEnabled,
          featureKey: PLATFORM_FEATURES.aiProviders.featureKey,
          subItems:
            edition === ApEdition.COMMUNITY
              ? undefined
              : [
                  { to: '/platform/ai', label: t('Providers'), end: true },
                  ...(edition === ApEdition.CLOUD
                    ? [{ to: '/platform/ai/tiers', label: t('Tiers') }]
                    : []),
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
          label: t('Authentication'),
          icon: LogInIcon,
          locked: !platform.plan.ssoEnabled,
          featureKey: PLATFORM_FEATURES.sso.featureKey,
        },
        {
          to: '/platform/secret-managers',
          label: t('Secret Managers'),
          icon: KeyRoundIcon,
          locked: !platform.plan.secretManagersEnabled,
          featureKey: PLATFORM_FEATURES.secretManagers.featureKey,
        },
        {
          to: '/platform/audit-log',
          label: t('Audit Logs'),
          icon: SquareDashedBottomCodeIcon,
          subItems: [
            {
              to: '/platform/audit-log',
              label: t('Events'),
              end: true,
              locked: !platform.plan.auditLogEnabled,
              featureKey: PLATFORM_FEATURES.auditLogs.featureKey,
            },
            {
              to: '/platform/audit-log/streaming',
              label: t('Event Streaming'),
              locked: !platform.plan.eventStreamingEnabled,
              featureKey: PLATFORM_FEATURES.eventStreaming.featureKey,
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
          icon: FileJson2Icon,
          locked: !platform.plan.apiKeysEnabled,
          featureKey: PLATFORM_FEATURES.apiKeys.featureKey,
        },
        {
          to: '/platform/embedding',
          label: t('Embedding'),
          icon: FrameIcon,
          locked: !platform.plan.embeddingEnabled,
          featureKey: PLATFORM_FEATURES.embedding.featureKey,
        },
        {
          to: '/platform/mcp',
          label: t('MCP Server'),
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
          icon: SettingsIcon,
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
          icon: ChartLineIcon,
          locked: edition === ApEdition.COMMUNITY,
        },
        ...(edition === ApEdition.CLOUD
          ? []
          : [
              {
                to: '/platform/configurations',
                label: t('Configurations'),
                icon: Settings2Icon,
              },
            ]),
      ],
    },
  ];

  return (
    <>
      {groups.map((group) => (
        <SidebarGroup key={group.label} className="py-1">
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
                  featureKey={item.featureKey}
                  subItems={item.subItems}
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      ))}
    </>
  );
}

type PlatformNavItem = Pick<
  SidebarItemType,
  'to' | 'label' | 'icon' | 'locked' | 'featureKey' | 'subItems'
>;
