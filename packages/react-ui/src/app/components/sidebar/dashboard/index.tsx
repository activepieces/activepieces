import { t } from 'i18next';
import {
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
  SidebarGroupContent,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar-shadcn';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { projectHooks } from '@/hooks/project-hooks';
import { authenticationSession } from '@/lib/authentication-session';
import { cn } from '@/lib/utils';
import { isNil, Permission } from '@activepieces/shared';

import { HelpAndFeedback } from '../../help-and-feedback';
import { SidebarGeneralItemType } from '../ap-sidebar-group';
import { ApSidebarItem, SidebarItemType } from '../ap-sidebar-item';
import { AppSidebarHeader } from '../sidebar-header';
import { SidebarUser } from '../sidebar-user';
import SidebarUsageLimits from '../sidebare-usage-limits';

export function ProjectDashboardSidebar() {
  const { platform } = platformHooks.useCurrentPlatform();
  const { project } = projectHooks.useCurrentProject();
  const { checkAccess } = useAuthorization();
  const { embedState } = useEmbedding();
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const permissionFilter = (link: SidebarGeneralItemType) => {
    if (link.type === 'link') {
      return isNil(link.hasPermission) || link.hasPermission;
    }
    return true;
  };

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

  const items = [flowsLink, tablesLink, todosLink, releasesLink].filter(
    permissionFilter,
  );

  const otherItems: SidebarItemType[] = [
    {
      type: 'link',
      to: authenticationSession.appendProjectRoutePrefix('/connections'),
      label: t('Connections'),
      icon: Link2,
      hasPermission: checkAccess(Permission.READ_APP_CONNECTION),
      show: true,
      isSubItem: false,
    },
    {
      type: 'link',
      to: authenticationSession.appendProjectRoutePrefix('/mcps'),
      label: t('MCP'),
      show: platform.plan.mcpsEnabled || !embedState.isEmbedded,
      hasPermission: checkAccess(Permission.READ_MCP),
      icon: McpSvg,
      isSubItem: false,
    },
  ];

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
  ];

  return (
    !embedState.hideSideNav && (
      <Sidebar variant="inset">
        <AppSidebarHeader />

        <SidebarContent className="gap-y-0">
          <SidebarGroup>
            <SidebarGroupLabel>{t('Automations')}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {items.map((item) => (
                  <ApSidebarItem key={item.label} {...item} />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupLabel>{t('Other')}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {otherItems.map((item) => (
                  <ApSidebarItem key={item.label} {...item} />
                ))}
                {!embedState.isEmbedded && (
                  <SidebarMenuItem>
                    <DropdownMenu
                      open={isMoreMenuOpen}
                      onOpenChange={setIsMoreMenuOpen}
                    >
                      <DropdownMenuTrigger asChild>
                        <div>
                          <SidebarMenuButton className="px-2 py-5">
                            <MoreHorizontal className="size-5" />
                            <span className="grow">{t('More')}</span>
                          </SidebarMenuButton>
                        </div>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="center"
                        side="bottom"
                        className="w-64"
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
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <HelpAndFeedback />
          <SidebarUsageLimits />
          <SidebarUser />
        </SidebarFooter>
      </Sidebar>
    )
  );
}
