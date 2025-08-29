import { t } from 'i18next';
import { Bot, Link2, ListTodo, Package, Table2, Workflow } from 'lucide-react';

import { McpSvg } from '@/assets/img/custom/mcp';
import { useEmbedding } from '@/components/embed-provider';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarRail,
  SidebarHeader,
} from '@/components/ui/sidebar-shadcn';
import { ProjectSwitcher } from '@/features/projects/components/project-switcher';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { projectHooks } from '@/hooks/project-hooks';
import { authenticationSession } from '@/lib/authentication-session';
import { isNil, Permission } from '@activepieces/shared';

import { HelpAndFeedback } from '../help-and-feedback';

import { ApSidebareGroup } from './ap-sidebar-group';
import { ApSidebarItem } from './ap-sidebar-item';
import { SidebarGeneralItemType, SidebarItemType } from './common';
import { SidebarUser } from './sidebar-user';

export function AppSidebar() {
  const { platform } = platformHooks.useCurrentPlatform();
  const { project } = projectHooks.useCurrentProject();
  const { checkAccess } = useAuthorization();
  const { embedState } = useEmbedding();

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

  return (
    !embedState.hideSideNav && (
      <Sidebar variant="inset">
        <SidebarHeader>
          <ProjectSwitcher />
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarMenu>
              {items.map((item) =>
                item.type === 'group' ? (
                  <ApSidebareGroup key={item.label} {...item} />
                ) : (
                  <ApSidebarItem key={item.label} {...item} />
                ),
              )}
            </SidebarMenu>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupLabel>{t('Misc')}</SidebarGroupLabel>
            <SidebarMenu>
              <ApSidebarItem
                to={authenticationSession.appendProjectRoutePrefix(
                  '/connections',
                )}
                label={t('Connections')}
                icon={Link2}
                type="link"
              />
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <HelpAndFeedback />
          </SidebarMenu>

          <SidebarUser />
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
    )
  );
}
