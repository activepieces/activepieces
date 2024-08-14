import { AlertCircle, Link2, Logs, Workflow, Wrench } from 'lucide-react';

import { issueHooks } from '@/features/issues/hooks/issue-hooks';

import { AllowOnlyLoggedInUserOnlyGuard } from './allow-logged-in-user-only-guard';
import { Sidebar, SidebarLink } from './sidebar';

export function DashboardContainer({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: showIssuesNotification } = issueHooks.useIssuesNotification();

  const links: SidebarLink[] = [
    {
      to: '/flows',
      label: 'Flows',
      icon: Workflow,
    },
    {
      to: '/runs',
      label: 'Runs',
      icon: Logs,
    },
    {
      to: '/issues',
      label: 'Issues',
      icon: AlertCircle,
      notification: showIssuesNotification,
    },
    {
      to: '/connections',
      label: 'Connections',
      icon: Link2,
    },
    {
      to: '/settings',
      label: 'Settings',
      icon: Wrench,
    },
  ];

  return (
    <AllowOnlyLoggedInUserOnlyGuard>
      <Sidebar links={links}>{children}</Sidebar>
    </AllowOnlyLoggedInUserOnlyGuard>
  );
}