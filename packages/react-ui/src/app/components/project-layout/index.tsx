import React, { ComponentType, SVGProps } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

import { useEmbedding } from '@/components/embed-provider';
import { Separator } from '@/components/ui/separator';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar-shadcn';
import { PurchaseExtraFlowsDialog } from '@/features/billing/components/active-flows-addon/purchase-active-flows-dialog';
import { flagsHooks } from '@/hooks/flags-hooks';
import { projectHooks } from '@/hooks/project-collection';
import { ApEdition, ApFlagId, isNil } from '@activepieces/shared';

import { authenticationSession } from '../../../lib/authentication-session';
import { AllowOnlyLoggedInUserOnlyGuard } from '../allow-logged-in-user-only-guard';
import { ProjectDashboardSidebar } from '../sidebar/dashboard';

import { ProjectDashboardLayoutHeader } from './project-dashboard-layout-header';

export type ProjectDashboardLayoutHeaderTab = {
  to: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
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
  const location = useLocation();
  const isPlatformPage = location.pathname.includes('/platform/');
  const isEmbedded = useEmbedding().embedState.isEmbedded;
  if (isNil(currentProjectId) || currentProjectId === '') {
    return <Navigate to="/sign-in" replace />;
  }

  const hideHeader =
    ['/templates', '/impact', '/leaderboard', '/quick'].some((item) =>
      location.pathname.includes(item),
    ) || isPlatformPage;

  return (
    <AllowOnlyLoggedInUserOnlyGuard>
      <ProjectChangedRedirector currentProjectId={currentProjectId}>
        <SidebarProvider hoverMode={true}>
          {!isEmbedded && <ProjectDashboardSidebar />}
          <SidebarInset className={`relative overflow-auto gap-4`}>
            <div className="flex flex-col">
              {!hideHeader && (
                <>
                  <ProjectDashboardLayoutHeader key={currentProjectId} />
                  <Separator className="mb-5" />
                </>
              )}
              <div className="px-4"> {children} </div>
            </div>
          </SidebarInset>
        </SidebarProvider>

        {edition === ApEdition.CLOUD && <PurchaseExtraFlowsDialog />}
      </ProjectChangedRedirector>
    </AllowOnlyLoggedInUserOnlyGuard>
  );
}
