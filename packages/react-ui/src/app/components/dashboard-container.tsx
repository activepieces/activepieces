import { t } from 'i18next';
import { AlertCircle, Link2, Logs, Workflow, Wrench } from 'lucide-react';

import { useEmbedding } from '@/components/embed-provider';
import { issueHooks } from '@/features/issues/hooks/issue-hooks';
import { flagsHooks } from '@/hooks/flags-hooks';
import { ApEdition, ApFlagId } from '@activepieces/shared';

import { AllowOnlyLoggedInUserOnlyGuard } from './allow-logged-in-user-only-guard';
import { Sidebar, SidebarLink } from './sidebar';

type DashboardContainerProps = {
  children: React.ReactNode;
};

export function DashboardContainer({ children }: DashboardContainerProps) {
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);
  const { data: showIssuesNotification } =
    issueHooks.useIssuesNotification(edition);

  const { embedState } = useEmbedding();
  const links: SidebarLink[] = [
    {
      to: '/flows',
      label: t('Flows'),
      icon: Workflow,
      showInEmbed: true,
    },
    {
      to: '/runs',
      label: t('Runs'),
      icon: Logs,
      showInEmbed: true,
    },
    {
      to: '/issues',
      label: t('Issues'),
      icon: AlertCircle,
      notification: showIssuesNotification,
      showInEmbed: false,
    },
    {
      to: '/connections',
      label: t('Connections'),
      icon: Link2,
      showInEmbed: true,
    },
    {
      to: '/settings',
      label: t('Settings'),
      icon: Wrench,
      showInEmbed: false,
    },
  ].filter((link) => !embedState.isEmbedded || link.showInEmbed);

  return (
    <AllowOnlyLoggedInUserOnlyGuard>
      <Sidebar
        isHomeDashboard={true}
        links={links}
        hideSideNav={embedState.hideSideNav}
      >
        {children}
      </Sidebar>
    </AllowOnlyLoggedInUserOnlyGuard>
  );
}
