import React, { createContext, useState } from 'react';
import { Navigate } from 'react-router-dom';

import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar-shadcn';
import { WelcomeTrialDialog } from '@/features/billing/components/trial-dialog';
import { UpgradeDialog } from '@/features/billing/components/upgrade-dialog';
import { flagsHooks } from '@/hooks/flags-hooks';
import { projectHooks } from '@/hooks/project-hooks';
import { ApFlagId, isNil } from '@activepieces/shared';

import { authenticationSession } from '../../lib/authentication-session';

import { AppSidebar } from './sidebar/app-sidebar';

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

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [isAlertClosed, setIsAlertClosed] = useState(false);

  const currentProjectId = authenticationSession.getProjectId();
  const { data: showBilling } = flagsHooks.useFlag<boolean>(
    ApFlagId.SHOW_BILLING,
  );

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
          <AppSidebar />
          <SidebarInset className="px-4 relative pb-4">{children}</SidebarInset>
        </SidebarProvider>

        {showBilling && <WelcomeTrialDialog />}
        <UpgradeDialog />
      </CloseTaskLimitAlertContext.Provider>
    </ProjectChangedRedirector>
  );
}
