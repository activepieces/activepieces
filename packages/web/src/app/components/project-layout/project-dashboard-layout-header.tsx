import { isNil, Permission } from '@activepieces/core-utils';
import { t } from 'i18next';

import { PAGE_GUTTER } from '@/components/custom/page';
import { PageTab, PageTabCount, PageTabs } from '@/components/custom/page-tabs';
import { BoxIcon } from '@/components/icons/box';
import { ConnectIcon } from '@/components/icons/connect';
import { HistoryIcon } from '@/components/icons/history';
import { ShieldIcon } from '@/components/icons/shield';
import { VariableIcon } from '@/components/icons/variable';
import { WorkflowIcon } from '@/components/icons/workflow';
import { useEmbedding } from '@/components/providers/embed-provider';
import { Badge } from '@/components/ui/badge';
import { flowApprovalsHooks } from '@/features/flow-approvals';
import { projectCollectionUtils } from '@/features/projects';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { authenticationSession } from '@/lib/authentication-session';
import { cn } from '@/lib/utils';

import { ProjectDashboardPageHeader } from './project-dashboard-page-header';

import { ProjectDashboardLayoutHeaderTab } from '.';

export const ProjectDashboardLayoutHeader = () => {
  const { project } = projectCollectionUtils.useCurrentProject();
  const { checkAccess, isFetchingProjectRole } = useAuthorization();
  const { platform } = platformHooks.useCurrentPlatform();
  const { embedState } = useEmbedding();
  const isEmbedded = embedState.isEmbedded;
  const { data: pendingApprovalsBadge } =
    flowApprovalsHooks.usePendingApprovalsBadge();
  const pendingCount = pendingApprovalsBadge?.data.length ?? 0;

  const primaryTabs: ProjectDashboardLayoutHeaderTab[] = [
    {
      to: authenticationSession.appendProjectRoutePrefix('/automations'),
      label: t('Automations'),
      icon: WorkflowIcon,
      hasPermission: checkAccess(Permission.READ_FLOW),
      show: true,
    },
  ];

  const secondaryTabs: ProjectDashboardLayoutHeaderTab[] = [
    {
      to: authenticationSession.appendProjectRoutePrefix('/runs'),
      label: t('Runs'),
      icon: HistoryIcon,
      hasPermission: checkAccess(Permission.READ_RUN),
      show: true,
    },
    {
      to: authenticationSession.appendProjectRoutePrefix('/connections'),
      label: t('Connections'),
      icon: ConnectIcon,
      hasPermission: checkAccess(Permission.READ_APP_CONNECTION),
      show: true,
    },
    {
      to: authenticationSession.appendProjectRoutePrefix('/variables'),
      label: t('Variables'),
      icon: VariableIcon,
      hasPermission: checkAccess(Permission.READ_VARIABLE),
      show: true,
    },
    {
      to: authenticationSession.appendProjectRoutePrefix('/releases'),
      icon: BoxIcon,
      label: t('Releases'),
      hasPermission:
        project.releasesEnabled &&
        checkAccess(Permission.READ_PROJECT_RELEASE) &&
        !isEmbedded,
      show: project.releasesEnabled,
    },
    {
      to: authenticationSession.appendProjectRoutePrefix('/approvals'),
      icon: ShieldIcon,
      label: t('Pending approvals'),
      hasPermission:
        !isFetchingProjectRole &&
        checkAccess(Permission.PUBLISH_SENSITIVE_FLOW_ACCESS),
      show: !!platform.plan.environmentsEnabled && !!project.sensitive,
      badgeCount: pendingCount,
    },
  ];

  const toPageTabs = (tabs: ProjectDashboardLayoutHeaderTab[]): PageTab[] =>
    tabs
      .filter((tab) => tab.show && tab.hasPermission)
      .map((tab) => ({
        to: tab.to,
        label: tab.label,
        icon: tab.icon,
        badge: tab.beta ? (
          <Badge variant="info">Beta</Badge>
        ) : isNil(tab.badgeCount) ? undefined : (
          <PageTabCount count={tab.badgeCount} />
        ),
      }));

  return (
    <div className={cn(PAGE_GUTTER, 'flex shrink-0 flex-col gap-6')}>
      {!isEmbedded && <ProjectDashboardPageHeader />}
      {!embedState.hideSideNav && (
        <PageTabs
          tabs={[toPageTabs(primaryTabs), toPageTabs(secondaryTabs)]}
          className={cn(isEmbedded && 'pt-2')}
        />
      )}
    </div>
  );
};

ProjectDashboardLayoutHeader.displayName = 'ProjectDashboardLayoutHeader';
