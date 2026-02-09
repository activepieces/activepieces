import { t } from 'i18next';
import { History, Link2, ListTodo, Zap } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

import { useEmbedding } from '@/components/embed-provider';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { authenticationSession } from '@/lib/authentication-session';
import { Permission } from '@activepieces/shared';

import { ProjectDashboardPageHeader } from './project-dashboard-page-header';

import { ProjectDashboardLayoutHeaderTab } from '.';

export const ProjectDashboardLayoutHeader = () => {
  const { platform } = platformHooks.useCurrentPlatform();
  const { checkAccess } = useAuthorization();
  const { embedState } = useEmbedding();
  const location = useLocation();
  const navigate = useNavigate();
  const isEmbedded = embedState.isEmbedded;

  const tabs: ProjectDashboardLayoutHeaderTab[] = [
    {
      to: authenticationSession.appendProjectRoutePrefix('/automations'),
      label: t('Automations'),
      icon: Zap,
      hasPermission: checkAccess(Permission.READ_FLOW),
      show: true,
    },
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
      to: authenticationSession.appendProjectRoutePrefix('/todos'),
      label: t('Todos'),
      icon: ListTodo,
      hasPermission: checkAccess(Permission.READ_TODOS),
      show: !platform.plan.embeddingEnabled,
    },
  ];

  const isPathActive = (path: string) => {
    return location.pathname.includes(path);
  };

  return (
    <div className="flex flex-col gap-1">
      {!isEmbedded && <ProjectDashboardPageHeader />}
      <Tabs className="px-4">
        {!embedState.hideSideNav && (
          <TabsList variant="outline">
            {tabs
              .filter((tab) => tab.show && tab.hasPermission)
              .map((tab) => (
                <TabsTrigger
                  key={tab.to}
                  value={tab.label.toLowerCase()}
                  variant="outline"
                  className="pb-3"
                  onClick={() => navigate(tab.to)}
                  data-state={isPathActive(tab.to) ? 'active' : 'inactive'}
                >
                  <tab.icon className="h-4 w-4 mr-2" />
                  {tab.label}
                </TabsTrigger>
              ))}
          </TabsList>
        )}
      </Tabs>
    </div>
  );
};

ProjectDashboardLayoutHeader.displayName = 'ProjectDashboardLayoutHeader';

export default ProjectDashboardLayoutHeader;
