import { ApEdition, ApFlagId } from '@activepieces/shared';
import { t } from 'i18next';
import { Crown } from 'lucide-react';

import { PageTabs, PageTab } from '@/components/custom/page-tabs';
import { flagsHooks } from '@/hooks/flags-hooks';
import { platformHooks } from '@/hooks/platform-hooks';

export function AdminTabs({ section }: { section: AdminSection }) {
  const { platform } = platformHooks.useCurrentPlatform();
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);
  const plan = platform.plan;
  const community = edition === ApEdition.COMMUNITY;
  const tabs = SECTION_TABS[section]({ plan, community })
    .filter((tab) => !tab.hidden)
    .map(
      (tab): PageTab => ({
        to: tab.to,
        label: tab.label,
        end: tab.end,
        badge: tab.locked ? (
          <Crown aria-label={t('Not in your plan')} className="text-gray-9" />
        ) : undefined,
      }),
    );
  if (tabs.length < 2) {
    return null;
  }
  return <PageTabs tabs={[tabs]} />;
}

AdminTabs.keepWhenPageLocked = true;

const SECTION_TABS: Record<
  AdminSection,
  (context: {
    plan: ReturnType<
      typeof platformHooks.useCurrentPlatform
    >['platform']['plan'];
    community: boolean;
  }) => AdminTab[]
> = {
  users: ({ plan }) => [
    { to: '/platform/users', label: t('Users'), end: true },
    {
      to: '/platform/users/roles',
      label: t('Roles'),
      locked: !plan.projectRolesEnabled,
    },
  ],
  pieces: ({ plan }) => [
    { to: '/platform/pieces', label: t('Pieces'), end: true },
    {
      to: '/platform/pieces/piece-sets',
      label: t('Piece sets'),
      locked: !plan.managePiecesEnabled,
    },
  ],
  auditLog: ({ plan }) => [
    {
      to: '/platform/audit-log',
      label: t('Events'),
      end: true,
      locked: !plan.auditLogEnabled,
    },
    {
      to: '/platform/audit-log/streaming',
      label: t('Streaming'),
      locked: !plan.eventStreamingEnabled,
    },
  ],
  mcp: () => [
    { to: '/platform/mcp', label: t('Tools'), end: true },
    { to: '/platform/mcp/activity', label: t('Activity') },
  ],
  workers: ({ plan }) => [
    { to: '/platform/workers', label: t('Machines'), end: true },
    {
      to: '/platform/workers/groups',
      label: t('Groups'),
      locked: !plan.workerGroupsEnabled,
    },
  ],
  health: () => [
    { to: '/platform/health', label: t('System'), end: true },
    { to: '/platform/health/runs', label: t('Runs') },
    { to: '/platform/health/queue', label: t('Queue') },
    { to: '/platform/health/triggers', label: t('Triggers') },
  ],
  billing: ({ community }) => [
    { to: '/platform/billing', label: t('Plan'), end: true, locked: community },
    { to: '/platform/billing/usage', label: t('Usage'), locked: community },
  ],
};

export type AdminSection =
  | 'users'
  | 'pieces'
  | 'auditLog'
  | 'mcp'
  | 'workers'
  | 'health'
  | 'billing';

type AdminTab = {
  to: string;
  label: string;
  end?: boolean;
  locked?: boolean;
  hidden?: boolean;
};
