import { t } from 'i18next';
import {
  ChevronDown,
  History,
  Link2,
  ListTodo,
  Package,
  Table2,
  Workflow,
} from 'lucide-react';
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { useEmbedding } from '@/components/embed-provider';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { projectCollectionUtils } from '@/hooks/project-collection';
import { authenticationSession } from '@/lib/authentication-session';
import { cn } from '@/lib/utils';
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
  const flowsLink: ProjectDashboardLayoutHeaderTab = {
    to: authenticationSession.appendProjectRoutePrefix('/flows'),
    label: t('Flows'),
    icon: Workflow,
    hasPermission: checkAccess(Permission.READ_FLOW),
    show: true,
  };

  const tablesLink: ProjectDashboardLayoutHeaderTab = {
    to: authenticationSession.appendProjectRoutePrefix('/tables'),
    label: t('Tables'),
    show: platform.plan.tablesEnabled,
    icon: Table2,
    hasPermission: checkAccess(Permission.READ_TABLE),
  };

  const runsLink: ProjectDashboardLayoutHeaderTab = {
    to: authenticationSession.appendProjectRoutePrefix('/runs'),
    label: t('Runs'),
    icon: History,
    hasPermission: checkAccess(Permission.READ_RUN),
    show: true,
  };

  const moreItems: ProjectDashboardLayoutHeaderTab[] = [
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
      show: platform.plan.todosEnabled,
      icon: ListTodo,
      hasPermission: checkAccess(Permission.READ_TODOS),
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

  const [pinnedItem, setPinnedItem] =
    useState<ProjectDashboardLayoutHeaderTab | null>(() => {
      const matchedItem = moreItems.find(
        (item) =>
          item.show &&
          item.hasPermission !== false &&
          location.pathname.includes(item.to),
      );
      return matchedItem || null;
    });
  const shownItemsUnderMoreDropdown = moreItems.filter(
    (item) => item.to !== pinnedItem?.to && item.show && item.hasPermission,
  );
  return (
    <div className="flex flex-col gap-1">
      {!isEmbedded && <ProjectDashboardPageHeader />}
      <Tabs className="px-4">
        {!embedState.hideSideNav && (
          <TabsList variant="outline">
            {flowsLink.show && flowsLink.hasPermission && (
              <TabsTrigger
                value="flows"
                variant="outline"
                className="pb-3"
                onClick={() => navigate(flowsLink.to)}
                data-state={
                  location.pathname.includes(flowsLink.to)
                    ? 'active'
                    : 'inactive'
                }
              >
                <flowsLink.icon className="h-4 w-4 mr-2" />
                {t('Flows')}
              </TabsTrigger>
            )}
            {tablesLink.show && tablesLink.hasPermission && (
              <TabsTrigger
                value="tables"
                variant="outline"
                className="pb-3"
                onClick={() => navigate(tablesLink.to)}
                data-state={
                  location.pathname.includes(tablesLink.to)
                    ? 'active'
                    : 'inactive'
                }
              >
                <tablesLink.icon className="h-4 w-4 mr-2" />
                {t('Tables')}
              </TabsTrigger>
            )}

            <Separator
              orientation="vertical"
              className="mx-2 h-5 self-center mb-2"
            />

            {runsLink.show && runsLink.hasPermission && (
              <TabsTrigger
                value="runs"
                variant="outline"
                className="pb-3"
                onClick={() => navigate(runsLink.to)}
                data-state={
                  location.pathname.includes(runsLink.to)
                    ? 'active'
                    : 'inactive'
                }
              >
                <runsLink.icon className="h-4 w-4 mr-2" />
                {t('Runs')}
              </TabsTrigger>
            )}
            {pinnedItem && pinnedItem.show && pinnedItem.hasPermission && (
              <TabsTrigger
                value="pinned"
                variant="outline"
                className="pb-3"
                onClick={() => navigate(pinnedItem.to)}
                data-state={
                  location.pathname.includes(pinnedItem.to)
                    ? 'active'
                    : 'inactive'
                }
              >
                <pinnedItem.icon className="h-4 w-4 mr-2" />
                {pinnedItem.label}
              </TabsTrigger>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                {(() => {
                  const activeItem = shownItemsUnderMoreDropdown.find((item) =>
                    location.pathname.includes(item.to),
                  );
                  if (shownItemsUnderMoreDropdown.length === 0) {
                    return null;
                  }

                  if (activeItem) {
                    return (
                      <TabsTrigger
                        value="more"
                        variant="outline"
                        className="pb-3"
                        data-state="active"
                      >
                        <activeItem.icon className="h-4 w-4 mr-2" />
                        {activeItem.label}
                        <ChevronDown className="h-4 w-4 ml-1" />
                      </TabsTrigger>
                    );
                  }

                  return (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-2 h-auto text-muted-foreground hover:text-foreground mb-2"
                    >
                      {t('More')}
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  );
                })()}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-64">
                {shownItemsUnderMoreDropdown.map((item) => {
                  return (
                    <DropdownMenuItem
                      key={item.to}
                      onClick={() => {
                        setPinnedItem(item);
                        navigate(item.to);
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <item.icon className={cn('size-4')} />
                        <span>{item.label}</span>
                      </div>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </TabsList>
        )}
      </Tabs>
    </div>
  );
};

ProjectDashboardLayoutHeader.displayName = 'ProjectDashboardLayoutHeader';

export default ProjectDashboardLayoutHeader;
