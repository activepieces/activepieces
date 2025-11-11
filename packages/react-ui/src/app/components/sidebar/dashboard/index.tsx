import { t } from 'i18next';
import { ListTodo, Package, Compass } from 'lucide-react';

import { useEmbedding } from '@/components/embed-provider';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarMenu,
  SidebarGroupContent,
  SidebarSeparator,
  useSidebar,
  SidebarGroupLabel,
} from '@/components/ui/sidebar-shadcn';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { projectHooks } from '@/hooks/project-hooks';
import { authenticationSession } from '@/lib/authentication-session';
import { isNil, Permission } from '@activepieces/shared';

import { HelpAndFeedback } from '../../help-and-feedback';
import { SidebarGeneralItemType } from '../ap-sidebar-group';
import { ApSidebarItem, SidebarItemType } from '../ap-sidebar-item';
import ProjectSideBarItem from '../project';
import { AppSidebarHeader } from '../sidebar-header';
import { SidebarUser } from '../sidebar-user';
import SidebarUsageLimits from '../sidebare-usage-limits';

// Refactor sidebar to new design
export function ProjectDashboardSidebar() {
  const { platform } = platformHooks.useCurrentPlatform();
  const { project } = projectHooks.useCurrentProject();
  const { data: projects } = projectHooks.useProjects();
  const { checkAccess } = useAuthorization();
  const { embedState } = useEmbedding();
  const { state, setOpen } = useSidebar();

  const permissionFilter = (link: SidebarGeneralItemType) => {
    if (link.type === 'link') {
      return isNil(link.hasPermission) || link.hasPermission;
    }
    return true;
  };

  const exploreLink: SidebarItemType = {
    type: 'link',
    to: authenticationSession.appendProjectRoutePrefix('/explore'),
    label: t('Explore'),
    show: true,
    icon: Compass,
    hasPermission: true,
    isSubItem: false,
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

  const todosLink: SidebarItemType = {
    type: 'link',
    to: authenticationSession.appendProjectRoutePrefix('/todos'),
    label: t('Todos'),
    show: platform.plan.todosEnabled || !embedState.isEmbedded,
    icon: ListTodo,
    hasPermission: checkAccess(Permission.READ_TODOS),
    isSubItem: false,
  };

  const items = [exploreLink, todosLink, releasesLink].filter(permissionFilter);

  return (
    !embedState.hideSideNav && (
      <Sidebar
        variant="inset"
        collapsible="icon"
        className="group/sidebar-hover"
        onClick={() => setOpen(true)}
      >
        <AppSidebarHeader />

        {state === 'collapsed' && <SidebarSeparator className="my-3" />}
        {state === 'expanded' && <div className="my-2" />}

        <SidebarContent className="gap-y-3">
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {items.map((item) => (
                  <ApSidebarItem key={item.label} {...item} />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarSeparator className="mb-0" />

          <SidebarGroup>
            <SidebarGroupLabel>Projects</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {projects?.map((p) => (
                  <ProjectSideBarItem
                    key={p.id}
                    project={p}
                    isCurrentProject={p.id === project.id}
                  />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter onClick={(e) => e.stopPropagation()}>
          <HelpAndFeedback />
          {state === 'expanded' && <SidebarUsageLimits />}
          <SidebarUser />
        </SidebarFooter>
      </Sidebar>
    )
  );
}
