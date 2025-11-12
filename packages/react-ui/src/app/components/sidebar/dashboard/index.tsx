import { t } from 'i18next';
import { Compass } from 'lucide-react';

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
import { projectHooks } from '@/hooks/project-hooks';
import { authenticationSession } from '@/lib/authentication-session';
import { isNil } from '@activepieces/shared';

import { HelpAndFeedback } from '../../help-and-feedback';
import { SidebarGeneralItemType } from '../ap-sidebar-group';
import { ApSidebarItem, SidebarItemType } from '../ap-sidebar-item';
import ProjectSideBarItem from '../project';
import { AppSidebarHeader } from '../sidebar-header';
import { SidebarUser } from '../sidebar-user';
import SidebarUsageLimits from '../sidebare-usage-limits';

export function ProjectDashboardSidebar() {
  const { project } = projectHooks.useCurrentProject();
  const { data: projects } = projectHooks.useProjects();
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

  const items = [exploreLink].filter(permissionFilter);

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
        {state === 'expanded' && <div className="mt-1" />}

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {items.map((item) => (
                  <ApSidebarItem key={item.label} {...item} />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarSeparator />

          <SidebarGroup>
            {state === 'expanded' && (
              <SidebarGroupLabel>{t('Projects')}</SidebarGroupLabel>
            )}
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
