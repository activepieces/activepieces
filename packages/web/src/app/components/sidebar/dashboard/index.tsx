import { isNil, Permission } from '@activepieces/core-utils';
import {
  PlatformRole,
  TeamProjectsLimit,
  TemplateTelemetryEventType,
} from '@activepieces/shared';
import { t } from 'i18next';
import {
  ChevronsUpDown,
  Folders,
  Home,
  Plus,
  Search,
  SearchX,
} from 'lucide-react';
import { Suspense, useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDebounce } from 'use-debounce';

import { BoxIcon } from '@/components/icons/box';
import { ChartLineIcon } from '@/components/icons/chart-line';
import { CompassIcon } from '@/components/icons/compass';
import { ShieldIcon } from '@/components/icons/shield';
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
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from '@/components/ui/sidebar-shadcn';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { VirtualizedScrollArea } from '@/components/ui/virtualized-scroll-area';
import {
  CreateProjectButton,
  getProjectName,
  projectCollectionUtils,
} from '@/features/projects';
import { ProjectLetterAvatar } from '@/features/projects/components/project-letter-avatar';
import { templatesTelemetryApi } from '@/features/templates';
import {
  useAuthorization,
  useIsPlatformAdmin,
} from '@/hooks/authorization-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { userHooks } from '@/hooks/user-hooks';
import { authenticationSession } from '@/lib/authentication-session';
import { CHAT_ROUTE, determineDefaultRoute } from '@/lib/route-utils';
import { cn } from '@/lib/utils';

import { recordAccess } from '../../global-search/access-history';
import { useGlobalSearch } from '../../global-search/global-search-context';
import { STATIC_PAGES } from '../../global-search/static-pages';
import { ApSidebarItem, SidebarItemType } from '../ap-sidebar-item';
import { CreatePanel } from '../create/create-panel';
import { AppSidebarHeader } from '../sidebar-header';
import SidebarUsageLimits from '../sidebar-usage-limits';
import { SidebarUser } from '../sidebar-user';

import { SidebarConversations } from './sidebar-conversations';

export function ProjectDashboardSidebar({
  className,
  collapsible = 'icon',
}: { className?: string; collapsible?: 'icon' | 'offcanvas' } = {}) {
  const { embedState } = useEmbedding();
  const { state } = useSidebar();
  const { data: currentUser } = userHooks.useCurrentUser();
  const { platform } = platformHooks.useCurrentPlatform();
  const { checkAccess } = useAuthorization();
  const { project } = projectCollectionUtils.useCurrentProject();

  const handleExploreClick = useCallback(() => {
    templatesTelemetryApi.sendEvent({
      eventType: TemplateTelemetryEventType.EXPLORE_VIEW,
      userId: currentUser?.id,
    });
  }, [currentUser?.id]);

  const chatEnabled = platform.plan.chatEnabled;

  // Home lands on a fresh full-page chat when chat is on; otherwise the
  // classic default route. Home just navigates — it's never a "selected" tab.
  const homeLink: SidebarItemType = {
    type: 'link',
    to: chatEnabled
      ? `${CHAT_ROUTE}?new=1`
      : determineDefaultRoute({ checkAccess }),
    label: t('Home'),
    show: true,
    icon: Home,
    hasPermission: true,
    isSubItem: false,
    isActive: () => false,
  };

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
      recordStaticPageAccess('/templates');
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
    onClick: () => recordStaticPageAccess('/impact'),
  };

  const releasesLink: SidebarItemType = {
    type: 'link',
    to: authenticationSession.appendProjectRoutePrefix('/releases'),
    label: t('Releases'),
    icon: BoxIcon,
    show: project.releasesEnabled,
    hasPermission:
      project.releasesEnabled &&
      checkAccess(Permission.READ_PROJECT_RELEASE) &&
      !embedState.isEmbedded,
    isSubItem: false,
  };

  // Explore/Impact live at the bottom of the sidebar, next to Platform Admin —
  // deliberately out of the way per product feedback.
  const footerItems = [exploreLink, impactLink]
    .filter((item) => item.show !== false)
    .filter((item) => isNil(item.hasPermission) || item.hasPermission);

  const topItems = [homeLink, releasesLink]
    .filter((item) => item.show !== false)
    .filter((item) => isNil(item.hasPermission) || item.hasPermission);

  return (
    !embedState.hideSideNav && (
      <Sidebar
        collapsible={collapsible}
        id={SIDEBAR_ID}
        className={className}
        resizable
      >
        <AppSidebarHeader />

        <SidebarContent className="overflow-y-auto overflow-x-hidden pt-1">
          <SidebarGroup className="py-1">
            <SidebarMenu>
              <SidebarCreateItem />
            </SidebarMenu>
          </SidebarGroup>
          <SidebarGroup className="py-1">
            <SidebarMenu>
              {topItems.map((item) => (
                <ApSidebarItem key={item.label} {...item} />
              ))}
              <SidebarSearchItem />
            </SidebarMenu>
          </SidebarGroup>
          <SidebarSeparator className="mx-2 my-1" />
          <SidebarProjectsGroup />
          <SidebarConversations />
        </SidebarContent>
        <SidebarFooter className="border-t">
          {state === 'expanded' && <DelayedSidebarUsageLimits />}
          <SidebarMenu>
            {footerItems.map((item) => (
              <ApSidebarItem key={item.label} {...item} />
            ))}
          </SidebarMenu>
          <SidebarPlatformAdminLink />
          <SidebarUser />
        </SidebarFooter>
      </Sidebar>
    )
  );
}

// The primary action: a filled Create button opening the create panel
// (chat / flow / table, with a project selector); collapses to a small
// primary plus tile on the icon rail.
function SidebarCreateItem() {
  const [open, setOpen] = useState(false);
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  return (
    <SidebarMenuItem>
      <Popover open={open} onOpenChange={setOpen} modal={false}>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <SidebarMenuButton
                isActive={open}
                aria-label={t('Create')}
                className={cn(
                  'group/create',
                  isCollapsed
                    ? 'hover:bg-transparent active:bg-transparent data-active:bg-transparent'
                    : 'justify-center bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 hover:text-primary-foreground active:text-primary-foreground data-active:bg-primary data-active:font-semibold data-active:text-primary-foreground data-open:hover:bg-primary/90',
                )}
              >
                {isCollapsed ? (
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-sm transition-transform group-hover/create:scale-105">
                    <Plus className="size-3.5" strokeWidth={2.5} />
                  </span>
                ) : (
                  <>
                    <Plus className="size-4 shrink-0" strokeWidth={2.5} />
                    <span className="text-sm font-semibold">{t('Create')}</span>
                  </>
                )}
              </SidebarMenuButton>
            </PopoverTrigger>
          </TooltipTrigger>
          {!open && isCollapsed && (
            <TooltipContent side="right">{t('Create')}</TooltipContent>
          )}
        </Tooltip>
        <PopoverContent
          side="right"
          align="start"
          sideOffset={8}
          // Don't auto-focus a tile on open (the zero-delay TooltipProvider
          // would instantly pop a tooltip + focus ring on it).
          onOpenAutoFocus={(event) => event.preventDefault()}
          onInteractOutside={(e) => {
            // Keep the create popover open when interacting with the nested project
            // selector popover / command list it spawns.
            const node = e.detail.originalEvent.target;
            if (
              node instanceof Element &&
              node.closest(
                '[data-radix-popper-content-wrapper],[role="dialog"],[role="alertdialog"],[data-sonner-toaster]',
              )
            ) {
              e.preventDefault();
            }
          }}
          className="w-[300px] rounded-2xl border-foreground/[0.08] bg-popover/95 p-3 shadow-2xl backdrop-blur-2xl"
        >
          <Suspense fallback={<CreatePanelSkeleton />}>
            <CreatePanel onClose={() => setOpen(false)} />
          </Suspense>
        </PopoverContent>
      </Popover>
    </SidebarMenuItem>
  );
}

function CreatePanelSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="h-5 w-20" />
      <div className="grid grid-cols-3 gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="aspect-square rounded-xl" />
        ))}
      </div>
    </div>
  );
}

// Search as a regular nav row (with the ⌘K hint); opens the Browse dialog.
function SidebarSearchItem() {
  const { open: searchOpen, setOpen: setSearchOpen } = useGlobalSearch();
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  return (
    <SidebarMenuItem>
      <Tooltip>
        <TooltipTrigger asChild>
          <SidebarMenuButton
            isActive={searchOpen}
            aria-label={t('Search')}
            onClick={() => setSearchOpen(true)}
          >
            <Search className="size-4" />
            {!isCollapsed && (
              <>
                <span className="text-sm">{t('Search')}</span>
                <kbd className="ml-auto rounded border border-border/60 bg-background/40 px-1 font-mono text-[10px] leading-none text-muted-foreground">
                  ⌘K
                </kbd>
              </>
            )}
          </SidebarMenuButton>
        </TooltipTrigger>
        {!searchOpen && isCollapsed && (
          <TooltipContent side="right" className="flex items-center gap-2">
            {t('Search')}
            <kbd className="rounded border border-border/60 bg-background/20 px-1 font-mono text-[10px] leading-none">
              ⌘K
            </kbd>
          </TooltipContent>
        )}
      </Tooltip>
    </SidebarMenuItem>
  );
}

// Projects section: the latest-selected project is pinned on top as the
// always-visible default (clicking it goes to its Automations); the trailing
// up/down chevron opens the switcher popover — search on top, virtualized
// project list (platforms can exceed 100 projects), New Project at the
// bottom. Switching is a client-side navigation (no reload), keeping any
// docked chat (?chat=) attached.
function SidebarProjectsGroup() {
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';
  const location = useLocation();
  const navigate = useNavigate();
  const { data: projects = [] } = projectCollectionUtils.useAll();
  const { platform } = platformHooks.useCurrentPlatform();
  const { data: currentUser } = userHooks.useCurrentUser();
  const activeProjectId = authenticationSession.getProjectId();
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery] = useDebounce(searchQuery, 300);

  if (projects.length === 0) {
    return null;
  }

  const currentProject = projects.find((p) => p.id === activeProjectId) ?? null;
  const otherProjects = projects.filter((p) => p.id !== activeProjectId);
  const query = debouncedSearchQuery.trim().toLowerCase();
  const displayProjects = query
    ? otherProjects.filter((p) =>
        getProjectName(p).toLowerCase().includes(query),
      )
    : otherProjects;

  const showNewProjectButton =
    platform.plan.teamProjectsLimit !== TeamProjectsLimit.NONE &&
    currentUser?.platformRole === PlatformRole.ADMIN;
  const showSwitcher = otherProjects.length > 0 || showNewProjectButton;

  const goToProject = (projectId: string) => {
    const chat = new URLSearchParams(location.search).get('chat');
    projectCollectionUtils.setCurrentProject(projectId);
    navigate(
      `/projects/${projectId}/automations${chat ? `?chat=${chat}` : ''}`,
    );
  };

  const closeAndGo = (projectId: string) => {
    setSwitcherOpen(false);
    setSearchQuery('');
    goToProject(projectId);
  };

  if (!currentProject) {
    return null;
  }
  const currentName = getProjectName(currentProject);

  return (
    <SidebarGroup className="shrink-0 py-1">
      <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">
        {t('Projects')}
      </SidebarGroupLabel>
      <SidebarMenu>
        <SidebarMenuItem className="flex w-full items-center gap-1">
          <SidebarMenuButton
            tooltip={currentName}
            className="min-w-0 flex-1"
            onClick={() => goToProject(currentProject.id)}
          >
            <ProjectLetterAvatar
              project={currentProject}
              className="size-[18px] shrink-0"
            />
            {!isCollapsed && (
              <span className="truncate text-sm font-semibold">
                {currentName}
              </span>
            )}
          </SidebarMenuButton>
          {showSwitcher && !isCollapsed && (
            <Popover
              open={switcherOpen}
              onOpenChange={(open) => {
                setSwitcherOpen(open);
                if (!open) {
                  setSearchQuery('');
                }
              }}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={t('Switch project')}
                  className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"
                >
                  <ChevronsUpDown className="size-3.5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                side="bottom"
                align="start"
                sideOffset={8}
                className="flex w-[280px] flex-col overflow-hidden rounded-lg p-0"
              >
                {/* Flush search header — icon + bare input, hairline below. */}
                <div className="flex h-10 shrink-0 items-center gap-2 border-b px-3">
                  <Search className="size-4 shrink-0 text-muted-foreground" />
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t('Search projects...')}
                    autoFocus
                    className="h-full w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  />
                </div>
                {displayProjects.length > 0 ? (
                  <VirtualizedScrollArea
                    className="max-h-[300px] p-1"
                    items={displayProjects}
                    estimateSize={() => 32}
                    getItemKey={(index) => displayProjects[index]?.id ?? index}
                    overscan={10}
                    renderItem={(project) => {
                      const name = getProjectName(project);
                      return (
                        <button
                          type="button"
                          onClick={() => closeAndGo(project.id)}
                          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent"
                        >
                          <ProjectLetterAvatar
                            project={project}
                            className="size-[18px] shrink-0"
                          />
                          <span className="min-w-0 flex-1 truncate">
                            {name}
                          </span>
                        </button>
                      );
                    }}
                  />
                ) : (
                  <div className="flex flex-col items-center gap-0.5 px-4 py-8 text-center">
                    {query ? (
                      <SearchX className="mb-1.5 size-5 text-muted-foreground/50" />
                    ) : (
                      <Folders className="mb-1.5 size-5 text-muted-foreground/50" />
                    )}
                    <p className="text-sm font-medium">
                      {query ? t('No projects found.') : t('No projects yet')}
                    </p>
                    {query && (
                      <p className="text-xs text-muted-foreground">
                        {t('Try a different search term')}
                      </p>
                    )}
                  </div>
                )}
                {showNewProjectButton && (
                  <div className="shrink-0 border-t p-1">
                    <CreateProjectButton
                      variant="menu-item"
                      projects={projects}
                      onCreate={(project) => closeAndGo(project.id)}
                    />
                  </div>
                )}
              </PopoverContent>
            </Popover>
          )}
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
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

function recordStaticPageAccess(href: string) {
  const page = STATIC_PAGES.find((p) => p.href === href);
  if (page) {
    recordAccess({
      id: page.id,
      type: 'page',
      label: page.label,
      href: page.href,
    });
  }
}

export const SIDEBAR_ID = 'project-sidebar';
