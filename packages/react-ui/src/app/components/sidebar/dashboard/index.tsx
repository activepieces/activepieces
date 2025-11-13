import { t } from 'i18next';
import { Compass } from 'lucide-react';
import { useLocation } from 'react-router-dom';

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
import { cn } from '@/lib/utils';
import { isNil } from '@activepieces/shared';

import { SidebarGeneralItemType } from '../ap-sidebar-group';
import { ApSidebarItem, SidebarItemType } from '../ap-sidebar-item';
import ProjectSideBarItem from '../project';
import { AppSidebarHeader } from '../sidebar-header';
import SidebarUsageLimits from '../sidebar-usage-limits';
import { SidebarUser } from '../sidebar-user';

export function ProjectDashboardSidebar() {
  const { data: projects } = projectHooks.useProjects();
  const { embedState } = useEmbedding();
  const { state, setOpen } = useSidebar();
  const location = useLocation();

  const permissionFilter = (link: SidebarGeneralItemType) => {
    if (link.type === 'link') {
      return isNil(link.hasPermission) || link.hasPermission;
    }
    return true;
  };

  const exploreLink: SidebarItemType = {
    type: 'link',
    to: '/explore',
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
        onClick={() => setOpen(true)}
        className={cn(state === 'collapsed' ? 'cursor-nesw-resize' : '')}
      >
        <AppSidebarHeader />

        {state === 'collapsed' && <SidebarSeparator className="my-3" />}
        {state === 'expanded' && <div className="mt-1" />}

        <SidebarContent
          className={cn(state === 'collapsed' ? 'gap-4' : 'gap-3')}
        >
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
              <SidebarMenu className={cn(state === 'collapsed' ? 'gap-2' : '')}>
                {projects?.map((p) => (
                  <ProjectSideBarItem
                    key={p.id}
                    project={p}
                    isCurrentProject={location.pathname.includes(
                      `/projects/${p.id}`,
                    )}
                  />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter onClick={(e) => e.stopPropagation()}>
          {state === 'expanded' && <SidebarUsageLimits />}
          <SidebarUser />
        </SidebarFooter>
      </Sidebar>
    )
  );
}
