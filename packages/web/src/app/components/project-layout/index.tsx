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
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar-shadcn';
import { CreditsUsageAlert, ManagePlanDialog } from '@/features/billing';
import { projectHooks } from '@/features/projects';
import { flagsHooks } from '@/hooks/flags-hooks';
import { cn } from '@/lib/utils';

import { authenticationSession } from '../../../lib/authentication-session';
import {
  GlobalSearchProvider,
  useGlobalSearch,
} from '../global-search/global-search-context';
import { PrimaryRail } from '../primary-rail';

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
  const { open: searchOpen } = useGlobalSearch();

  return (
    <div className="flex h-full w-full overflow-hidden">
      {!isEmbedded && <PrimaryRail />}
      <SidebarProvider
        defaultOpen={false}
        hoverMode={!searchOpen}
        className="flex-1 min-w-0 w-auto will-change-transform"
      >
        <SidebarInset className="flex flex-col h-full overflow-hidden bg-gray-2">
          <div
            className={cn(
              'flex-1 flex flex-col overflow-hidden',
              !isEmbedded && 'pr-2 pt-3 pb-3',
            )}
          >
            <div
              id="dashboard-content-container"
              className={cn(
                'relative flex flex-col h-full bg-gray-1 overflow-clip',
                !isEmbedded && 'rounded-xl shadow-panel border',
              )}
            >
              {!hideHeader && (
                <ProjectDashboardLayoutHeader key={currentProjectId} />
              )}
              <CreditsUsageAlert />
              <div className="flex-1 overflow-auto">{children}</div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
