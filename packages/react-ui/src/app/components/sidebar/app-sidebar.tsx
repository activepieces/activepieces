import { useQuery } from '@tanstack/react-query';
import { t } from 'i18next';
import {
  Bot,
  GitBranch,
  Link2,
  ListTodo,
  MoreHorizontal,
  Package,
  Puzzle,
  Table2,
  Workflow,
} from 'lucide-react';
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { McpSvg } from '@/assets/img/custom/mcp';
import { useEmbedding } from '@/components/embed-provider';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarRail,
  SidebarHeader,
  SidebarGroupContent,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar-shadcn';
import { flowsApi } from '@/features/flows/lib/flows-api';
import { foldersHooks } from '@/features/folders/lib/folders-hooks';
import { ProjectSwitcher } from '@/features/projects/components/project-switcher';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { flagsHooks } from '@/hooks/flags-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { projectHooks } from '@/hooks/project-hooks';
import { authenticationSession } from '@/lib/authentication-session';
import { cn } from '@/lib/utils';
import { ApEdition, ApFlagId, isNil, Permission } from '@activepieces/shared';

import { HelpAndFeedback } from '../help-and-feedback';

import { ApSidebareGroup } from './ap-sidebar-group';
import { ApSidebarItem } from './ap-sidebar-item';
import { SidebarGeneralItemType, SidebarItemType } from './common';
import { FoldersSection } from './sidebar-folders'; // Import the new component
import { SidebarUser } from './sidebar-user';
import UsageLimitsButton from './usage-limits-button';

export function AppSidebar() {
  const { platform } = platformHooks.useCurrentPlatform();
  const { project } = projectHooks.useCurrentProject();
  const { checkAccess } = useAuthorization();
  const branding = flagsHooks.useWebsiteBranding();
  const { embedState } = useEmbedding();
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const isInBuilder = location.pathname.includes('/flows/');

  const showSwitcher =
    edition !== ApEdition.COMMUNITY && !embedState.isEmbedded;

  const permissionFilter = (link: SidebarGeneralItemType) => {
    if (link.type === 'link') {
      return isNil(link.hasPermission) || link.hasPermission;
    }
    return true;
  };

  const { folders, isLoading: foldersLoading } = foldersHooks.useFolders();

  const { data: flows, isLoading: flowsLoading } = useQuery({
    queryKey: ['flow-table', project.id],
    staleTime: 0,
    queryFn: () => {
      return flowsApi.list({
        projectId: project.id,
        cursor: undefined,
        limit: 100000,
      });
    },
  });

  const flowsData = flows?.data || [];

  const releasesLink: SidebarItemType = {
    type: 'link',
    to: authenticationSession.appendProjectRoutePrefix('/releases'),
    icon: Package,
    label: t('Releases'),
    hasPermission:
      project.releasesEnabled && checkAccess(Permission.READ_PROJECT_RELEASE),
    show: project.releasesEnabled,
    isSubItem: false,
  };

  const flowsLink: SidebarItemType = {
    type: 'link',
    to: authenticationSession.appendProjectRoutePrefix('/flows'),
    icon: Workflow,
    label: t('Flows'),
    hasPermission: checkAccess(Permission.READ_FLOW),
    isSubItem: false,
    show: true,
    isActive: (pathname) =>
      pathname.includes('/flows') ||
      pathname.includes('/runs') ||
      pathname.includes('/issues'),
  };

  const mcpLink: SidebarItemType = {
    type: 'link',
    to: authenticationSession.appendProjectRoutePrefix('/mcps'),
    label: t('MCP'),
    show: platform.plan.mcpsEnabled || !embedState.isEmbedded,
    icon: McpSvg,
    hasPermission: checkAccess(Permission.READ_MCP),
    isSubItem: false,
  };

  const agentsLink: SidebarItemType = {
    type: 'link',
    to: authenticationSession.appendProjectRoutePrefix('/agents'),
    label: t('Agents'),
    icon: Bot,
    show: platform.plan.agentsEnabled || !embedState.isEmbedded,
    hasPermission: true,
    isSubItem: false,
  };

  const tablesLink: SidebarItemType = {
    type: 'link',
    to: authenticationSession.appendProjectRoutePrefix('/tables'),
    label: t('Tables'),
    show: platform.plan.tablesEnabled || !embedState.isEmbedded,
    icon: Table2,
    hasPermission: checkAccess(Permission.READ_TABLE),
    isSubItem: false,
  };

  const todosLink: SidebarItemType = {
    type: 'link',
    to: authenticationSession.appendProjectRoutePrefix('/todos'),
    label: t('Todos'),
    show: platform.plan.todosEnabled || !embedState.isEmbedded,
    icon: ListTodo,
    hasPermission: checkAccess(Permission.READ_TODOS),
    isSubItem: false,
  };

  const items: SidebarGeneralItemType[] = [
    flowsLink,
    agentsLink,
    tablesLink,
    mcpLink,
    todosLink,
    releasesLink,
  ].filter(permissionFilter);

  const moreItems = [
    {
      type: 'link',
      to: authenticationSession.appendProjectRoutePrefix('/settings/pieces'),
      label: t('Pieces'),
      icon: Puzzle,
      show: true,
    },
    {
      to: authenticationSession.appendProjectRoutePrefix(
        '/settings/environments',
      ),
      label: t('Environments'),
      icon: GitBranch,
      type: 'link',
      show: checkAccess(Permission.READ_PROJECT_RELEASE),
    },
    {
      type: 'link',
      to: authenticationSession.appendProjectRoutePrefix('/connections'),
      label: t('Connections'),
      icon: Link2,
      show: checkAccess(Permission.READ_APP_CONNECTION),
    },
    {
      type: 'link',
      to: authenticationSession.appendProjectRoutePrefix('/mcps'),
      label: t('MCP'),
      show:
        (platform.plan.mcpsEnabled || !embedState.isEmbedded) &&
        checkAccess(Permission.READ_MCP),
      icon: McpSvg,
      tutorialTab: 'mcpServers',
    },
  ];

  return (
    !embedState.hideSideNav && (
      <Sidebar variant="inset">
        <SidebarHeader>
          {showSwitcher ? (
            <ProjectSwitcher />
          ) : (
            <img
              src={branding.logos.fullLogoUrl}
              alt={t('home')}
              className="object-contain w-40"
            />
          )}
        </SidebarHeader>

        <SidebarContent>
          {/* Automations Section - Only shown in builder */}
          {isInBuilder && (
            <SidebarGroup>
              <SidebarGroupLabel>{t('Automations')}</SidebarGroupLabel>
              <SidebarGroupContent>
                <FoldersSection
                  folders={folders}
                  flows={flowsData}
                  isLoading={foldersLoading || flowsLoading}
                />
              </SidebarGroupContent>
            </SidebarGroup>
          )}

          {/* Products Section - Only shown outside builder */}
          {!isInBuilder && (
            <SidebarGroup>
              <SidebarGroupLabel>{t('Products')}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {items
                    .filter((item) => item.label !== 'Agents')
                    .map((item) =>
                      item.type === 'group' ? (
                        <ApSidebareGroup key={item.label} {...item} />
                      ) : (
                        <ApSidebarItem key={item.label} {...item} />
                      ),
                    )}

                  <SidebarMenuItem>
                    <DropdownMenu
                      open={isMoreMenuOpen}
                      onOpenChange={setIsMoreMenuOpen}
                    >
                      <DropdownMenuTrigger asChild>
                        <div>
                          <SidebarMenuButton asChild>
                            <div className="flex px-2 items-center gap-2 w-full text-sidebar-accent-foreground">
                              <MoreHorizontal className="size-5" />
                              <span className="grow">{t('More')}</span>
                            </div>
                          </SidebarMenuButton>
                        </div>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="start"
                        side="right"
                        className="w-[220px]"
                      >
                        {moreItems
                          .filter((item) => item.show)
                          .map((item) => {
                            const isActive = location.pathname.includes(
                              item.to,
                            );

                            return (
                              <DropdownMenuItem
                                key={item.to}
                                onClick={() => {
                                  navigate(item.to);
                                }}
                              >
                                <div className="flex items-center gap-2">
                                  <item.icon
                                    className={cn('size-4', {
                                      'text-primary': isActive,
                                    })}
                                  />
                                  <span>{item.label}</span>
                                </div>
                              </DropdownMenuItem>
                            );
                          })}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}
        </SidebarContent>
        <SidebarFooter>
          {!isInBuilder && (
            <SidebarMenu>
              <HelpAndFeedback />
            </SidebarMenu>
          )}

          <UsageLimitsButton />

          <SidebarUser />
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
    )
  );
}
