import { Compass, LineChart, Trophy } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, useLocation } from 'react-router-dom';

import { useEmbedding } from '@/components/embed-provider';
import { Separator } from '@/components/ui/separator';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar-shadcn';
import { PurchaseExtraFlowsDialog } from '@/features/billing/components/active-flows-addon/purchase-active-flows-dialog';
import { flagsHooks } from '@/hooks/flags-hooks';
import { projectHooks } from '@/hooks/project-hooks';
import { ApEdition, ApFlagId, isNil } from '@activepieces/shared';

import { authenticationSession } from '../../../lib/authentication-session';
import { ProjectDashboardSidebar } from '../sidebar/dashboard';

import { ProjectDashboardPageHeader } from './project-dashboard-page-header';
import { ProjectNavigation } from './project-navigation';

export type ProjectDashboardLayoutHeaderTab = {
  to: string;
  label: string;
  icon: React.ElementType;
  hasPermission: boolean;
  show: boolean;
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
  const { embedState } = useEmbedding();
  const isEmbedded = embedState.isEmbedded;
  if (isNil(currentProjectId) || currentProjectId === '') {
    return <Navigate to="/sign-in" replace />;
  }

  const itemsWithoutHeader: ProjectDashboardLayoutHeaderTab[] = [
    {
      to: '/explore',
      label: t('Explore'),
      show: !isEmbedded,
      icon: Compass,
      hasPermission: true,
    },
    {
      to: '/impact',
      label: t('Impact'),
      show: !isEmbedded,
      icon: LineChart,
      hasPermission: true,
    },
    {
      to: '/leaderboard',
      label: t('Leaderboard'),
      show: !isEmbedded,
      icon: Trophy,
      hasPermission: true,
    },
  ];

  const hideHeader =
    itemsWithoutHeader.some((item) => location.pathname.includes(item.to)) ||
    isPlatformPage;

  // Pages that should show the navigation sidebar
  const showNavigation =
    !hideHeader &&
    !embedState.hideFolders &&
    (location.pathname.includes('/flows') ||
      location.pathname.includes('/tables') ||
      location.pathname.includes('/runs') ||
      location.pathname.includes('/connections') ||
      location.pathname.includes('/releases'));

  return (
    <ProjectChangedRedirector currentProjectId={currentProjectId}>
      <SidebarProvider>
        {!isEmbedded && <ProjectDashboardSidebar />}
        <SidebarInset className={`relative overflow-auto pb-4 gap-4`}>
          <div className="flex flex-col">
            {!hideHeader && (
              <>
                <ProjectDashboardPageHeader />
                <Separator className="mb-5" />
              </>
            )}
            <div className="px-4 flex flex-row gap-8">
              {showNavigation && <ProjectNavigation />}
              <div className="flex-1 overflow-hidden">{children}</div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>

      {edition === ApEdition.CLOUD && <PurchaseExtraFlowsDialog />}
    </ProjectChangedRedirector>
  );
}
