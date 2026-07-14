import { isNil } from '@activepieces/core-utils';
import { ApEdition, ApFlagId } from '@activepieces/shared';
import React from 'react';
import { Navigate } from 'react-router-dom';

import { useEmbedding } from '@/components/providers/embed-provider';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar-shadcn';
import { PurchaseExtraFlowsDialog } from '@/features/billing';
import { projectHooks } from '@/features/projects';
import { flagsHooks } from '@/hooks/flags-hooks';

import { authenticationSession } from '../../../lib/authentication-session';
import { GlobalSearchProvider } from '../global-search/global-search-context';
import { ProjectDashboardSidebar } from '../sidebar/dashboard';

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

// Standalone full-page layout for the routes that live outside the workspace
// shell (/templates, /impact): sidebar + headerless content frame. The pages
// render their own headers.
export function ProjectDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);
  const currentProjectId = authenticationSession.getProjectId();
  const isEmbedded = useEmbedding().embedState.isEmbedded;
  if (isNil(currentProjectId) || currentProjectId === '') {
    return <Navigate to="/sign-in" replace />;
  }

  return (
    <ProjectChangedRedirector currentProjectId={currentProjectId}>
      <GlobalSearchProvider>
        <SidebarProvider defaultOpen={true} hoverMode={true}>
          {!isEmbedded && <ProjectDashboardSidebar collapsible="offcanvas" />}
          <SidebarInset className="flex flex-col h-full overflow-hidden bg-sidebar">
            <div className="flex-1 flex flex-col overflow-hidden">
              <div
                id="dashboard-content-container"
                className="relative flex flex-col h-full bg-background overflow-clip"
              >
                <div className="flex-1 overflow-auto">{children}</div>
              </div>
            </div>
          </SidebarInset>
        </SidebarProvider>
        {edition === ApEdition.CLOUD && <PurchaseExtraFlowsDialog />}
      </GlobalSearchProvider>
    </ProjectChangedRedirector>
  );
}
