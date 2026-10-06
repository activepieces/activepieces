import { isNil } from '@activepieces/core-utils';
import { ApEdition, ApFlagId } from '@activepieces/shared';
import {
  ChartLineData02Icon,
  CompassIcon,
  Robot01Icon,
  UnplugIcon,
} from '@hugeicons/core-free-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';

import { type IconSvgElement } from '@/components/custom/hugeicons-icon';
import { useEmbedding } from '@/components/providers/embed-provider';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { CreditsUsageAlert, ManagePlanDialog } from '@/features/billing';
import { projectHooks } from '@/features/projects';
import { useRailOpenState } from '@/features/workspace/lib/rail-collapsed';
import { flagsHooks } from '@/hooks/flags-hooks';

import { authenticationSession } from '../../../lib/authentication-session';
import { GlobalSearchProvider } from '../global-search/global-search-context';
import { PrimaryRail } from '../primary-rail';
import { MobileSidebarBar } from '../sidebar/mobile-sidebar-bar';

import { ProjectDashboardLayoutHeader } from './project-dashboard-layout-header';

export type ProjectDashboardLayoutHeaderTab = {
  to: string;
  label: string;
  icon: IconSvgElement;
  hasPermission: boolean;
  show: boolean;
  beta?: boolean;
  badgeCount?: number;
};

const ProjectChangedRedirector = ({
  currentProjectId,
  children,
}: {
  currentProjectId: string;
  children: React.ReactNode;
}) => {
  projectHooks.useReloadPageIfProjectIdChanged(currentProjectId);
  return children;
};

export function ProjectDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);
  const currentProjectId = authenticationSession.getProjectId();
  const { t } = useTranslation();
  const location = useLocation();
  const isPlatformPage = location.pathname.includes('/platform/');
  const isEmbedded = useEmbedding().embedState.isEmbedded;
  const hasNoProject = isNil(currentProjectId) || currentProjectId === '';

  const itemsWithoutHeader: ProjectDashboardLayoutHeaderTab[] = [
    {
      to: '/templates',
      label: t('Explore'),
      show: !isEmbedded,
      icon: CompassIcon,
      hasPermission: true,
    },
    {
      to: '/impact',
      label: t('Impact'),
      show: !isEmbedded,
      icon: ChartLineData02Icon,
      hasPermission: true,
    },
    {
      to: '/chat',
      label: t('Chat'),
      show: !isEmbedded,
      icon: CompassIcon,
      hasPermission: true,
    },
    {
      to: '/agents',
      label: t('Agents'),
      show: !isEmbedded,
      icon: Robot01Icon,
      hasPermission: true,
    },
    {
      to: '/mcp-server',
      label: t('MCP'),
      show: !isEmbedded,
      icon: UnplugIcon,
      hasPermission: true,
    },
  ];

  const hideHeader =
    hasNoProject ||
    itemsWithoutHeader.some((item) => location.pathname.includes(item.to)) ||
    isPlatformPage;

  const inner = (
    <GlobalSearchProvider>
      <ProjectDashboardLayoutInner
        hideHeader={hideHeader}
        isEmbedded={isEmbedded}
        currentProjectId={currentProjectId ?? ''}
      >
        {children}
      </ProjectDashboardLayoutInner>
      {edition !== ApEdition.COMMUNITY && <ManagePlanDialog />}
    </GlobalSearchProvider>
  );

  if (hasNoProject) {
    return inner;
  }

  return (
    <ProjectChangedRedirector currentProjectId={currentProjectId!}>
      {inner}
    </ProjectChangedRedirector>
  );
}

function ProjectDashboardLayoutInner({
  hideHeader,
  isEmbedded,
  currentProjectId,
  children,
}: {
  hideHeader: boolean;
  isEmbedded: boolean;
  currentProjectId: string;
  children: React.ReactNode;
}) {
  const rail = useRailOpenState();
  const { websiteName } = flagsHooks.useWebsiteBranding();

  return (
    <SidebarProvider
      open={rail.open}
      onOpenChange={rail.onOpenChange}
      className="h-svh overflow-hidden"
    >
      {!isEmbedded && <PrimaryRail />}
      <SidebarInset className="min-w-0 overflow-hidden bg-gray-1">
        {!isEmbedded && <MobileSidebarBar title={websiteName} />}
        <div
          id="dashboard-content-container"
          className="relative flex h-full flex-col overflow-clip"
        >
          <CreditsUsageAlert />
          <div className="flex min-h-0 flex-1 flex-col overflow-auto">
            {!hideHeader && (
              <ProjectDashboardLayoutHeader key={currentProjectId} />
            )}
            <div className="flex min-h-0 flex-1 flex-col">{children}</div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
