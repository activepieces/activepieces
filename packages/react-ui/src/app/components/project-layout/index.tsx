import { ListTodo } from 'lucide-react';
import React, { createContext, useState, ComponentType, SVGProps } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, useLocation } from 'react-router-dom';

import { Separator } from '@/components/ui/separator';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar-shadcn';
import { PurchaseExtraFlowsDialog } from '@/features/billing/components/active-flows-addon/purchase-active-flows-dialog';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { projectHooks } from '@/hooks/project-hooks';
import { isNil, Permission } from '@activepieces/shared';

import { authenticationSession } from '../../../lib/authentication-session';
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
  const { checkAccess } = useAuthorization();
  const { t } = useTranslation();
  const location = useLocation();

  if (isNil(currentProjectId) || currentProjectId === '') {
    return <Navigate to="/sign-in" replace />;
  }

  const itemsWithoutHeader: ProjectDashboardLayoutHeaderTab[] = [
    {
      to: authenticationSession.appendProjectRoutePrefix('/todos'),
      label: t('Todos'),
      icon: ListTodo,
      hasPermission: checkAccess(Permission.READ_TODOS),
      show: true,
    },
  ];

  const hideHeader = itemsWithoutHeader.some((item) =>
    location.pathname.includes(item.to),
  );

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
          <SidebarInset className={`relative overflow-auto pb-4 gap-4 pt-4`}>
            <div className="flex flex-col">
              {!hideHeader && (
                <>
                  <ProjectDashboardLayoutHeader />
                  <Separator className="mb-4" />
                </>
              )}
              <div className="px-4"> {children} </div>
            </div>
          </SidebarInset>
        </SidebarProvider>

        <PurchaseExtraFlowsDialog />
      </CloseTaskLimitAlertContext.Provider>
    </ProjectChangedRedirector>
  );
}
