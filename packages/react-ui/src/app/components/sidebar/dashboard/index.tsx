import { useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { Compass, Search } from 'lucide-react';
import { useState, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { useEmbedding } from '@/components/embed-provider';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
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
import {
  isNil,
  PROJECT_COLOR_PALETTE,
  ProjectType,
} from '@activepieces/shared';

import { SidebarGeneralItemType } from '../ap-sidebar-group';
import { ApSidebarItem, SidebarItemType } from '../ap-sidebar-item';
import ProjectSideBarItem from '../project';
import { AppSidebarHeader } from '../sidebar-header';
import SidebarUsageLimits from '../sidebar-usage-limits';
import { SidebarUser } from '../sidebar-user';

export function ProjectDashboardSidebar() {
  const { data: allProjects } = projectHooks.useProjects();
  const { embedState } = useEmbedding();
  const { state, setOpen } = useSidebar();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { setCurrentProject } = projectHooks.useCurrentProject();
  const teamProjects = useMemo(() => {
    return allProjects?.filter((project) => project.type === ProjectType.TEAM);
  }, [allProjects]);

  const personalProject = useMemo(() => {
    return allProjects?.find(
      (project) => project.type === ProjectType.PERSONAL,
    );
  }, [allProjects]);

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

  const filteredProjects = useMemo(() => {
    if (!teamProjects) return [];
    if (!searchQuery.trim()) return teamProjects;

    const query = searchQuery.toLowerCase().trim();
    return teamProjects.filter((project) =>
      project.displayName.toLowerCase().includes(query),
    );
  }, [teamProjects, searchQuery]);

  const handleProjectSelect = async (projectId: string) => {
    const project = allProjects?.find((p) => p.id === projectId);
    if (project) {
      await setCurrentProject(queryClient, project);
      navigate('/');
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  return (
    !embedState.hideSideNav && (
      <Sidebar
        variant="inset"
        collapsible="icon"
        onClick={() => setOpen(true)}
        className={cn(
          state === 'collapsed' ? 'cursor-nesw-resize' : '',
          'group',
          'p-1',
        )}
      >
        <AppSidebarHeader />

        {state === 'collapsed' && <div className="mt-1" />}
        {state === 'expanded' && <div className="mt-2" />}

        <SidebarContent
          className={cn(
            state === 'collapsed' ? 'gap-2' : 'gap-0',
            'scrollbar-hover',
          )}
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

          <SidebarSeparator
            className={cn(state === 'collapsed' ? 'mb-3' : 'mb-5')}
          />

          <SidebarGroup>
            {state === 'expanded' && (
              <div className="flex items-center justify-between">
                <SidebarGroupLabel>{t('Projects')}</SidebarGroupLabel>
                <Popover open={searchOpen} onOpenChange={setSearchOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 hover:bg-accent"
                    >
                      <Search className="text-muted-foreground" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-[280px] p-0"
                    align="start"
                    side="right"
                    sideOffset={8}
                  >
                    <Command>
                      <CommandInput
                        placeholder={t('Search projects...')}
                        value={searchQuery}
                        onValueChange={setSearchQuery}
                      />
                      <CommandList>
                        <CommandEmpty>{t('No projects found.')}</CommandEmpty>
                        <CommandGroup>
                          {filteredProjects.map((project) => (
                            <CommandItem
                              key={project.id}
                              value={project.id}
                              onSelect={handleProjectSelect}
                              className="flex items-center gap-2 cursor-pointer"
                            >
                              <Avatar
                                className="size-6 flex items-center justify-center rounded-sm"
                                style={{
                                  backgroundColor:
                                    PROJECT_COLOR_PALETTE[project.icon.color]
                                      .color,
                                  color:
                                    PROJECT_COLOR_PALETTE[project.icon.color]
                                      .textColor,
                                }}
                              >
                                {project.displayName.charAt(0)}
                              </Avatar>
                              <span className="flex-1 truncate">
                                {project.displayName}
                              </span>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            )}
            <SidebarGroupContent>
              <SidebarMenu
                className={cn(
                  state === 'collapsed'
                    ? 'gap-2 flex flex-col items-center'
                    : '',
                )}
              >
                {personalProject && (
                  <ProjectSideBarItem
                    key={personalProject.id}
                    project={personalProject}
                    isCurrentProject={location.pathname.includes(
                      `/projects/${personalProject.id}`,
                    )}
                    handleProjectSelect={handleProjectSelect}
                  />
                )}
                {teamProjects?.map((p) => (
                  <ProjectSideBarItem
                    key={p.id}
                    project={p}
                    isCurrentProject={location.pathname.includes(
                      `/projects/${p.id}`,
                    )}
                    handleProjectSelect={handleProjectSelect}
                  />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          <div className="flex-grow" />
          <div className="px-2">
            {state === 'expanded' && <SidebarUsageLimits />}
          </div>
        </SidebarContent>
        <SidebarFooter onClick={(e) => e.stopPropagation()}>
          <SidebarUser />
        </SidebarFooter>
      </Sidebar>
    )
  );
}
