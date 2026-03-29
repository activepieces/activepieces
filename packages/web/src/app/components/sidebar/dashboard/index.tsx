import {
  isNil,
  PROJECT_COLOR_PALETTE,
  PlatformRole,
  ProjectType,
  TeamProjectsLimit,
  TemplateTelemetryEventType,
} from '@activepieces/shared';
import { t } from 'i18next';
import { Search, Plus } from 'lucide-react';
import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDebounce } from 'use-debounce';

import { NewProjectDialog } from '@/app/routes/platform/projects/new-project-dialog';
import { SearchInput } from '@/components/custom/search-input';
import { ChartLineIcon } from '@/components/icons/chart-line';
import { CompassIcon } from '@/components/icons/compass';
import { ShieldIcon } from '@/components/icons/shield';
import { TrophyIcon } from '@/components/icons/trophy';
import { useEmbedding } from '@/components/providers/embed-provider';
import { Button } from '@/components/ui/button';
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
  SidebarSeparator,
  useSidebar,
  SidebarGroupLabel,
  SidebarMenuItem,
} from '@/components/ui/sidebar-shadcn';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { VirtualizedScrollArea } from '@/components/ui/virtualized-scroll-area';
import { projectCollectionUtils, getProjectName } from '@/features/projects';
import { templatesTelemetryApi } from '@/features/templates';
import { useIsPlatformAdmin } from '@/hooks/authorization-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { userHooks } from '@/hooks/user-hooks';
import { cn } from '@/lib/utils';

import { recordAccess } from '../../global-search/access-history';
import { GlobalSearchCommand } from '../../global-search/global-search-command';
import { STATIC_PAGES } from '../../global-search/static-pages';
import { SidebarGeneralItemType } from '../ap-sidebar-group';
import { ApSidebarItem, SidebarItemType } from '../ap-sidebar-item';
import ProjectSideBarItem from '../project';
import { AppSidebarHeader } from '../sidebar-header';
import SidebarUsageLimits from '../sidebar-usage-limits';
import { SidebarUser } from '../sidebar-user';

export function ProjectDashboardSidebar({
  className,
}: { className?: string } = {}) {
  const { data: projects } = projectCollectionUtils.useAll();
  const { embedState } = useEmbedding();
  const { state } = useSidebar();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery] = useDebounce(searchQuery, 300);
  const [searchOpen, setSearchOpen] = useState(false);
  const navigate = useNavigate();
  const { data: currentUser } = userHooks.useCurrentUser();
  const { platform } = platformHooks.useCurrentPlatform();
  const [isProjectsScrolled, setIsProjectsScrolled] = useState(false);
  const [hasMoreBelow, setHasMoreBelow] = useState(false);
  const projectsScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!searchOpen) {
      setSearchQuery('');
    }
  }, [searchOpen]);


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
      const teamProjects = projects.filter(
        (project) => project.type === ProjectType.TEAM,
      );
      return teamProjects.length >= 1;
    }
    return false;
  }, [platform.plan.teamProjectsLimit, projects]);

  const isSearchMode = debouncedSearchQuery.length > 0;

  const displayProjects = useMemo(() => {
    if (isSearchMode) {
      const query = debouncedSearchQuery.toLowerCase();
      return projects.filter((project) =>
        project.displayName.toLowerCase().includes(query),
      );
    }
    return projects;
  }, [isSearchMode, debouncedSearchQuery, projects]);

  useEffect(() => {
    const container = projectsScrollRef.current;
    const viewport = container?.querySelector(
      '[data-radix-scroll-area-viewport]',
    );
    if (!viewport) return;
    const checkScroll = () => {
      setIsProjectsScrolled(viewport.scrollTop > 0);
      setHasMoreBelow(
        viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight > 1,
      );
    };
    checkScroll();
    viewport.addEventListener('scroll', checkScroll);
    return () => viewport.removeEventListener('scroll', checkScroll);
  }, [displayProjects.length]);

  const handleProjectSelect = useCallback(
    async (projectId: string) => {
      const project = projects.find((p) => p.id === projectId);
      if (project) {
        const palette = project.icon
          ? PROJECT_COLOR_PALETTE[project.icon.color]
          : null;
        const name = getProjectName(project);
        recordAccess({
          id: `project-${projectId}`,
          type: 'project',
          label: name,
          href: `/projects/${projectId}/automations`,
          iconBgColor: palette?.color,
          iconTextColor: palette?.textColor,
          iconLetter: name.charAt(0).toUpperCase(),
        });
      }
      projectCollectionUtils.setCurrentProject(projectId);
      navigate(`/projects/${projectId}/automations`);
      setSearchOpen(false);
    },
    [navigate, projects],
  );

  const permissionFilter = (link: SidebarGeneralItemType) => {
    if (link.type === 'link') {
      return isNil(link.hasPermission) || link.hasPermission;
    }
    return true;
  };
  const handleExploreClick = useCallback(() => {
    templatesTelemetryApi.sendEvent({
      eventType: TemplateTelemetryEventType.EXPLORE_VIEW,
      userId: currentUser?.id,
    });
  }, []);

  const exploreLink: SidebarItemType = {
    type: 'link',
    to: '/templates',
    label: t('Explore'),
    show: true,
    icon: CompassIcon,
    hasPermission: true,
    isSubItem: false,
    onClick: () => {
      handleExploreClick();
      const page = STATIC_PAGES.find((p) => p.href === '/templates');
      if (page)
        recordAccess({
          id: page.id,
          type: 'page',
          label: page.label,
          href: page.href,
        });
    },
  };

  const impactLink: SidebarItemType = {
    type: 'link',
    to: '/impact',
    label: t('Impact'),
    icon: ChartLineIcon,
    show: true,
    hasPermission: true,
    isSubItem: false,
    onClick: () => {
      const page = STATIC_PAGES.find((p) => p.href === '/impact');
      if (page)
        recordAccess({
          id: page.id,
          type: 'page',
          label: page.label,
          href: page.href,
        });
    },
  };

  const leaderboardLink: SidebarItemType = {
    type: 'link',
    to: '/leaderboard',
    label: t('Leaderboard'),
    icon: TrophyIcon,
    show: true,
    hasPermission: true,
    isSubItem: false,
    onClick: () => {
      const page = STATIC_PAGES.find((p) => p.href === '/leaderboard');
      if (page)
        recordAccess({
          id: page.id,
          type: 'page',
          label: page.label,
          href: page.href,
        });
    },
  };

  const items = [exploreLink, impactLink, leaderboardLink].filter(
    permissionFilter,
  );

  return (
    !embedState.hideSideNav && (
      <Sidebar
        collapsible="icon"
        id={SIDEBAR_ID}
        className={cn('max-h-[100vh]', className)}
      >
        <AppSidebarHeader />

        <SidebarContent className="overflow-x-hidden">
          <SidebarGroup className="px-2 pb-1 pt-1">
            <div className="mb-1 pb-1 group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
              <GlobalSearchCommand />
            </div>
            <SidebarMenu>
              {items.map((item) => (
                <ApSidebarItem key={item.label} {...item} />
              ))}
            </SidebarMenu>
          </SidebarGroup>

          <SidebarGroup className="flex-1 overflow-hidden w-full py-0">
            <div className="flex items-center justify-between group-data-[collapsible=icon]:hidden px-2">
              <SidebarGroupLabel className="font-normal">{t('Projects')}</SidebarGroupLabel>
              <div className="flex items-center justify-center gap-1">
                {shouldShowNewProjectButton && (
                  <>
                    {!shouldDisableNewProjectButton ? (
                      <NewProjectDialog
                        onCreate={(project) => {
                          navigate(`/projects/${project.id}/flows`);
                        }}
                      >
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 hover:bg-sidebar-accent"
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
                        className="h-6 w-6 hover:bg-sidebar-accent"
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
                      <SearchInput
                        placeholder={t('Search projects...')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e)}
                        className="h-9"
                        autoFocus
                      />
                    </PopoverContent>
                  </Popover>
                )}
              </div>
            </div>
            {isProjectsScrolled && (
              <div className="border-t border-border" />
            )}
            <div
              ref={projectsScrollRef}
              className="relative flex-1 grow min-h-0 flex flex-col overflow-hidden"
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              <div className="flex grow max-h-[100%]">
                {displayProjects.length > 0 ? (
                  <VirtualizedScrollArea
                    className={cn(
                      'flex-1',
                      state === 'collapsed'
                        ? 'flex flex-col items-center scrollbar-none'
                        : 'scrollbar-hover',
                    )}
                    items={displayProjects}
                    estimateSize={() => 34}
                    getItemKey={(index) => displayProjects[index]?.id ?? index}
                    overscan={10}
                    renderItem={(project) => (
                      <SidebarMenuItem className="w-full px-2">
                        <ProjectSideBarItem
                          key={project.id}
                          project={project}
                          isCurrentProject={location.pathname.includes(
                            `/projects/${project.id}`,
                          )}
                          handleProjectSelect={handleProjectSelect}
                        />
                      </SidebarMenuItem>
                    )}
                  />
                ) : (
                  isSearchMode && (
                    <div className="px-2 py-2 text-sm text-muted-foreground">
                      {state === 'expanded' && t('No projects found.')}
                    </div>
                  )
                )}
              </div>
              {hasMoreBelow && (
                <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-sidebar to-transparent" />
              )}
            </div>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="pt-0 gap-0.5">
          <div className="group-data-[state=collapsed]:hidden">
            <SidebarUsageLimits />
          </div>
          <SidebarPlatformAdminLink />
          <SidebarUser />
        </SidebarFooter>
      </Sidebar>
    )
  );
}

function DelayedSidebarUsageLimits() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShow(true), 250);
    return () => clearTimeout(timer);
  }, []);

  return show ? (
    <div>
      <SidebarUsageLimits />
    </div>
  ) : null;
}

function SidebarPlatformAdminLink() {
  const showPlatformAdmin = useIsPlatformAdmin();
  const { embedState } = useEmbedding();

  if (embedState.isEmbedded || !showPlatformAdmin) {
    return null;
  }

  return (
    <SidebarMenu>
      <ApSidebarItem
        type="link"
        to="/platform/projects"
        label={t('Platform Admin')}
        icon={ShieldIcon}
        isSubItem={false}
        show={true}
        hasPermission={true}
        onClick={() => {
          const page = STATIC_PAGES.find(
            (p) =>
              p.href === '/platform/projects' && p.id === 'page-platform-admin',
          );
          if (page)
            recordAccess({
              id: page.id,
              type: 'page',
              label: page.label,
              href: page.href,
            });
        }}
      />
    </SidebarMenu>
  );
}

export const SIDEBAR_ID = 'project-sidebar';
