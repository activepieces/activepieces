import React, { createContext, useState } from 'react';
import { Navigate } from 'react-router-dom';

import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar-shadcn';
import { PurchaseExtraFlowsDialog } from '@/features/billing/components/active-flows-addon/purchase-active-flows-dialog';
import { projectHooks } from '@/hooks/project-hooks';
import { isNil } from '@activepieces/shared';

import { authenticationSession } from '../../lib/authentication-session';

import { ProjectDashboardSidebar } from './sidebar/dashboard';

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

export const CloseTaskLimitAlertContext = createContext({
  isAlertClosed: false,
  setIsAlertClosed: (_isAlertClosed: boolean) => {},
});

export function ProjectDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isAlertClosed, setIsAlertClosed] = useState(false);
  const currentProjectId = authenticationSession.getProjectId();

  if (isNil(currentProjectId) || currentProjectId === '') {
    return <Navigate to="/sign-in" replace />;
  }

  return (
    <ProjectChangedRedirector currentProjectId={currentProjectId}>
      <CloseTaskLimitAlertContext.Provider
        value={{
          isAlertClosed,
          setIsAlertClosed,
        }}
      >
        <SidebarProvider>
          <ProjectDashboardSidebar />
          <SidebarInset className={`relative overflow-auto px-4 pb-4`}>
            {children}
          </SidebarInset>
        </SidebarProvider>
        <PurchaseExtraFlowsDialog />
      </CloseTaskLimitAlertContext.Provider>
    </ProjectChangedRedirector>
  );
}
