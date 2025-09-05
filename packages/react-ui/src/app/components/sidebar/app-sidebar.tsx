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
  SidebarRail,
  SidebarHeader,
  SidebarGroupContent,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar-shadcn';
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

  const showNavigation =
    location.pathname.includes('/flows/') ||
    location.pathname.includes('/tables/');

  const showSwitcher =
    edition !== ApEdition.COMMUNITY && !embedState.isEmbedded;

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

  const items: SidebarGeneralItemType[] = [
    flowsLink,
    tablesLink,
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
          {!showNavigation && (
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
                          <SidebarMenuButton className="px-2 py-5">
                            <MoreHorizontal className="size-5" />
                            <span className="grow">{t('More')}</span>
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

          {showNavigation && <FoldersSection />}
        </SidebarContent>
        <SidebarFooter>
          {!showNavigation && <HelpAndFeedback />}
          {!showNavigation && <UsageLimitsButton />}
          <SidebarUser />
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
    )
  );
}
