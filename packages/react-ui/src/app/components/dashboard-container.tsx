import { createContext, useState } from 'react';
import { Navigate } from 'react-router-dom';

import { useEmbedding } from '@/components/embed-provider';
import { AiCreditsLimitAlert } from '@/features/billing/components/ai-credits-limit-alert';
import { ProjectLockedAlert } from '@/features/billing/components/project-locked-alert';
import { TaskLimitAlert } from '@/features/billing/components/task-limit-alert';
import { WelcomeTrialDialog } from '@/features/billing/components/trial-dialog';
import { UpgradeDialog } from '@/features/billing/components/upgrade-dialog';
import {
  useShowPlatformAdminDashboard,
} from '@/hooks/authorization-hooks';
import { flagsHooks } from '@/hooks/flags-hooks';
import { projectHooks } from '@/hooks/project-hooks';
import { ApEdition, ApFlagId, isNil } from '@activepieces/shared';

import { authenticationSession } from '../../lib/authentication-session';

import { SidebarComponent } from './sidebar';
import { DashboardSidebar } from './sidebar/sidebar-dashboard';

type DashboardContainerProps = {
  children: React.ReactNode;
};

export const CloseTaskLimitAlertContext = createContext({
  isAlertClosed: false,
  setIsAlertClosed: (_isAlertClosed: boolean) => { },
});

export function DashboardContainer({ children }: DashboardContainerProps) {
  const { embedState } = useEmbedding();
  const currentProjectId = authenticationSession.getProjectId();
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);
  const { data: showBilling } = flagsHooks.useFlag<boolean>(
    ApFlagId.SHOW_BILLING,
  );
  const [isAlertClosed, setIsAlertClosed] = useState(false);

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
        <SidebarComponent
          isHomeDashboard={true}
          sidebar={<DashboardSidebar />}
          hideSideNav={embedState.hideSideNav}
        >
          <>
            <>
              <ProjectLockedAlert />
              <TaskLimitAlert />
              <AiCreditsLimitAlert />
            </>
            {children}
          </>
        </SidebarComponent>
        {showBilling && <WelcomeTrialDialog />}
        {edition === ApEdition.CLOUD && <UpgradeDialog />}
      </CloseTaskLimitAlertContext.Provider>
    </ProjectChangedRedirector>
  );
}


type ProjectChangedRedirectorProps = {
  currentProjectId: string;
  children: React.ReactNode;
};
const ProjectChangedRedirector = ({
  currentProjectId,
  children,
}: ProjectChangedRedirectorProps) => {
  projectHooks.useReloadPageIfProjectIdChanged(currentProjectId);
  return children;
};