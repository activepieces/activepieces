import { Compass } from 'lucide-react';
import React, { ComponentType, SVGProps } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, useLocation } from 'react-router-dom';

import { useEmbedding } from '@/components/embed-provider';
import { Separator } from '@/components/ui/separator';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar-shadcn';
import { PurchaseExtraFlowsDialog } from '@/features/billing/components/active-flows-addon/purchase-active-flows-dialog';
import { projectHooks } from '@/hooks/project-hooks';
import { isNil } from '@activepieces/shared';

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

export function ProjectDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const currentProjectId = authenticationSession.getProjectId();
  const { t } = useTranslation();
  const location = useLocation();
  const isPlatformPage = location.pathname.includes('/platform/');
  const isEmbedded = useEmbedding().embedState.isEmbedded;
  if (isNil(currentProjectId) || currentProjectId === '') {
    return <Navigate to="/sign-in" replace />;
  }

  const itemsWithoutHeader: ProjectDashboardLayoutHeaderTab[] = [
    {
      to: '/explore',
      label: t('Explore'),
      show: true,
      icon: Compass,
      hasPermission: true,
    },
  ];

  const hideHeader =
    itemsWithoutHeader.some((item) => location.pathname.includes(item.to)) ||
    isPlatformPage;

  return (
    <ProjectChangedRedirector currentProjectId={currentProjectId}>
      <SidebarProvider>
        {!isEmbedded && <ProjectDashboardSidebar />}
        <SidebarInset className={`relative overflow-auto pb-4 gap-4`}>
          <div className="flex flex-col">
            {!hideHeader && (
              <>
                <ProjectDashboardLayoutHeader />
                <Separator className="mb-5" />
              </>
            )}
            <div className="px-4"> {children} </div>
          </div>
        </SidebarInset>
      </SidebarProvider>

      <PurchaseExtraFlowsDialog />
    </ProjectChangedRedirector>
  );
}
