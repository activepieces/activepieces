import { useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { Compass, Search, Loader2, Plus } from 'lucide-react';
import { useState, useMemo, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDebounce } from 'use-debounce';

import { NewProjectDialog } from '@/app/routes/platform/projects/new-project-dialog';
import { useEmbedding } from '@/components/embed-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { platformHooks } from '@/hooks/platform-hooks';
import { projectHooks } from '@/hooks/project-hooks';
import { userHooks } from '@/hooks/user-hooks';
import { cn } from '@/lib/utils';
import {
  isNil,
  PlatformRole,
  ProjectType,
  TeamProjectsLimit,
} from '@activepieces/shared';

import { SidebarGeneralItemType } from '../ap-sidebar-group';
import { ApSidebarItem, SidebarItemType } from '../ap-sidebar-item';
import ProjectSideBarItem from '../project';
import { AppSidebarHeader } from '../sidebar-header';
import SidebarUsageLimits from '../sidebar-usage-limits';
import { SidebarUser } from '../sidebar-user';

export function ProjectDashboardSidebar() {
  const {
    data: projectPages,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch: refetchProjects,
  } = projectHooks.useProjectsInfinite(20);
  const { embedState } = useEmbedding();
  const { state } = useSidebar();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery] = useDebounce(searchQuery, 300);
  const [searchOpen, setSearchOpen] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { setCurrentProject } = projectHooks.useCurrentProject();
  const projectsScrollRef = useRef<HTMLDivElement>(null);
  const { data: currentUser } = userHooks.useCurrentUser();
  const { platform } = platformHooks.useCurrentPlatform();

  const {
    data: searchResults,
    isLoading: isSearching,
    refetch: refetchSearchResults,
  } = projectHooks.useProjects({
    displayName: debouncedSearchQuery,
    limit: 100,
  });

  useEffect(() => {
    if (!searchOpen) {
      setSearchQuery('');
    }
  }, [searchOpen]);

  const allProjects = useMemo(() => {
    const projects = projectPages?.pages.flatMap((page) => page.data) ?? [];
    const uniqueProjects = Array.from(
      new Map(projects.map((project) => [project.id, project])).values(),
    );
    return uniqueProjects;
  }, [projectPages]);

  const shouldShowNewProjectButton = useMemo(() => {
    if (platform.plan.teamProjectsLimit === TeamProjectsLimit.NONE) {
      return false;
    }
    return currentUser?.platformRole === PlatformRole.ADMIN;
  }, [platform.plan.teamProjectsLimit]);

  const shouldShowSearchButton = useMemo(() => {
    if (platform.plan.teamProjectsLimit === TeamProjectsLimit.NONE) {
      return false;
    }
    return true;
  }, [platform.plan.teamProjectsLimit]);

  const shouldDisableNewProjectButton = useMemo(() => {
    if (platform.plan.teamProjectsLimit === TeamProjectsLimit.ONE) {
      const teamProjects = allProjects.filter(
        (project) => project.type === ProjectType.TEAM,
      );
      return teamProjects.length >= 1;
    }
    return false;
  }, [platform.plan.teamProjectsLimit, allProjects]);

  const isSearchMode = debouncedSearchQuery.length > 0;

  const displayProjects = useMemo(() => {
    if (isSearchMode) {
      return searchResults ?? [];
    }
    return allProjects;
  }, [isSearchMode, searchResults, allProjects]);

  useEffect(() => {
    const scrollContainer = projectsScrollRef.current;
    if (!scrollContainer || isSearchMode) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
      const scrollThreshold = 100;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

      if (
        distanceFromBottom < scrollThreshold &&
        hasNextPage &&
        !isFetchingNextPage
      ) {
        fetchNextPage();
      }
    };

    scrollContainer.addEventListener('scroll', handleScroll);

    handleScroll();

    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, isSearchMode]);

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

  const handleProjectSelect = async (projectId: string) => {
    const project = displayProjects?.find((p) => p.id === projectId);
    if (project) {
      await setCurrentProject(queryClient, project);
      navigate('/');
      setSearchOpen(false);
    }
  };

  return (
    !embedState.hideSideNav && (
      <Sidebar variant="inset" collapsible="icon" className="group p-1">
        {/* onClick removed - handled in base Sidebar component to prevent auto-expansion on navigation */}
        <AppSidebarHeader />

        {state === 'collapsed' && <div className="mt-1" />}
        {state === 'expanded' && <div className="mt-2" />}

        <SidebarContent
          className={cn(
            state === 'collapsed' ? 'gap-2' : 'gap-0',
            'scrollbar-hover',
            'cursor-default',
            'flex',
            'flex-col',
            'overflow-hidden',
          )}
        >
          <SidebarGroup className="cursor-default shrink-0">
            <SidebarGroupContent>
              <SidebarMenu>
                {items.map((item) => (
                  <ApSidebarItem key={item.label} {...item} />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarSeparator
            className={cn(state === 'collapsed' ? 'mb-3' : 'mb-5', 'shrink-0')}
          />

          <SidebarGroup className="flex-1 flex flex-col overflow-hidden">
            {state === 'expanded' && (
              <div className="flex items-center justify-between">
                <SidebarGroupLabel>{t('Projects')}</SidebarGroupLabel>
                <div className="flex items-center gap-1">
                  {shouldShowNewProjectButton && (
                    <>
                      {!shouldDisableNewProjectButton ? (
                        <NewProjectDialog
                          onCreate={() => {
                            refetchProjects();
                            refetchSearchResults();
                          }}
                        >
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 hover:bg-accent"
                          >
                            <Plus />
                          </Button>
                        </NewProjectDialog>
                      ) : (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div>
                              <Button
                                variant="ghost"
                                size="icon"
                                disabled
                                className="h-6 w-6"
                              >
                                <Plus />
                              </Button>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-[250px]">
                            <p className="text-xs mb-1">
                              {t(
                                'Upgrade your plan to create additional team projects.',
                              )}{' '}
                              <button
                                className="text-xs text-primary underline hover:no-underline"
                                onClick={() =>
                                  window.open(
                                    'https://www.activepieces.com/pricing',
                                    '_blank',
                                  )
                                }
                              >
                                {t('View Plans')}
                              </button>
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </>
                  )}
                  {shouldShowSearchButton && (
                    <Popover open={searchOpen} onOpenChange={setSearchOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 hover:bg-accent"
                        >
                          <Search />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-[280px] p-3"
                        align="start"
                        side="right"
                        sideOffset={8}
                      >
                        <Input
                          placeholder={t('Search projects...')}
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="h-9"
                          autoFocus
                        />
                      </PopoverContent>
                    </Popover>
                  )}
                </div>
              </div>
            )}
            <div
              ref={projectsScrollRef}
              className={cn(
                'flex-1 overflow-y-auto',
                state === 'collapsed'
                  ? 'flex flex-col items-center scrollbar-none'
                  : 'scrollbar-hover',
              )}
              onClick={(e) => e.stopPropagation()}
            >
              <SidebarMenu
                className={cn(
                  state === 'collapsed'
                    ? 'gap-2 flex flex-col items-center'
                    : '',
                )}
              >
                {displayProjects.map((project) => (
                  <ProjectSideBarItem
                    key={project.id}
                    project={project}
                    isCurrentProject={location.pathname.includes(
                      `/projects/${project.id}`,
                    )}
                    handleProjectSelect={handleProjectSelect}
                  />
                ))}
                {(isFetchingNextPage || (isSearchMode && isSearching)) && (
                  <div className="flex items-center gap-2 px-2 py-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {state === 'expanded' && <span>{t('Loading...')}</span>}
                  </div>
                )}
                {isSearchMode &&
                  !isSearching &&
                  displayProjects.length === 0 && (
                    <div className="px-2 py-2 text-sm text-muted-foreground">
                      {state === 'expanded' && t('No projects found.')}
                    </div>
                  )}
              </SidebarMenu>
            </div>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter
          onClick={(e) => e.stopPropagation()}
          className="cursor-default"
        >
          {state === 'expanded' && (
            <div className="mb-2">
              <SidebarUsageLimits />
            </div>
          )}
          <SidebarUser />
        </SidebarFooter>
      </Sidebar>
    )
  );
}
