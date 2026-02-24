import { Permission } from '@activepieces/shared';
import { t } from 'i18next';
import { History, Link2, Package, Table2, Workflow } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

import { useEmbedding } from '@/components/embed-provider';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { projectCollectionUtils } from '@/hooks/project-collection';
import { authenticationSession } from '@/lib/authentication-session';
import { Permission } from '@activepieces/shared';

import { ProjectDashboardPageHeader } from './project-dashboard-page-header';

import { ProjectDashboardLayoutHeaderTab } from '.';

export const ProjectDashboardLayoutHeader = () => {
  const { project } = projectCollectionUtils.useCurrentProject();
  const { platform } = platformHooks.useCurrentPlatform();
  const { checkAccess } = useAuthorization();
  const { embedState } = useEmbedding();
  const location = useLocation();
  const navigate = useNavigate();
  const isEmbedded = embedState.isEmbedded;

  const primaryTabs: ProjectDashboardLayoutHeaderTab[] = [
    {
      to: authenticationSession.appendProjectRoutePrefix('/flows'),
      label: t('Flows'),
      icon: Workflow,
      hasPermission: checkAccess(Permission.READ_FLOW),
      show: true,
    },
    {
      to: authenticationSession.appendProjectRoutePrefix('/tables'),
      label: t('Tables'),
      show: platform.plan.tablesEnabled,
      icon: Table2,
      hasPermission: checkAccess(Permission.READ_TABLE),
    },
  ];

  const secondaryTabs: ProjectDashboardLayoutHeaderTab[] = [
    {
      to: authenticationSession.appendProjectRoutePrefix('/runs'),
      label: t('Runs'),
      icon: History,
      hasPermission: checkAccess(Permission.READ_RUN),
      show: true,
    },
    {
      to: authenticationSession.appendProjectRoutePrefix('/connections'),
      label: t('Connections'),
      icon: Link2,
      hasPermission: checkAccess(Permission.READ_APP_CONNECTION),
      show: true,
    },
    {
      to: authenticationSession.appendProjectRoutePrefix('/releases'),
      icon: Package,
      label: t('Releases'),
      hasPermission:
        project.releasesEnabled &&
        checkAccess(Permission.READ_PROJECT_RELEASE) &&
        !isEmbedded,
      show: project.releasesEnabled,
    },
  ];

  const visiblePrimaryTabs = primaryTabs.filter(
    (tab) => tab.show && tab.hasPermission,
  );
  const visibleSecondaryTabs = secondaryTabs.filter(
    (tab) => tab.show && tab.hasPermission,
  );

  const renderTab = (tab: ProjectDashboardLayoutHeaderTab) => (
    <TabsTrigger
      key={tab.to}
      value={tab.to}
      variant="outline"
      className="pb-3"
      onClick={() => navigate(tab.to)}
      data-state={location.pathname.includes(tab.to) ? 'active' : 'inactive'}
    >
      <tab.icon className="h-4 w-4 mr-2" />
      {tab.label}
    </TabsTrigger>
  );

  return (
    <div className="flex flex-col gap-1">
      {!isEmbedded && <ProjectDashboardPageHeader />}
      <Tabs className="px-4">
        {!embedState.hideSideNav && (
          <TabsList variant="outline">
            {visiblePrimaryTabs.map(renderTab)}
            {visiblePrimaryTabs.length > 0 &&
              visibleSecondaryTabs.length > 0 && (
                <Separator
                  orientation="vertical"
                  className="mx-2 h-5 self-center mb-2"
                />
              )}
            {visibleSecondaryTabs.map(renderTab)}
          </TabsList>
        )}
      </Tabs>
    </div>
  );
};

ProjectDashboardLayoutHeader.displayName = 'ProjectDashboardLayoutHeader';

export default ProjectDashboardLayoutHeader;
