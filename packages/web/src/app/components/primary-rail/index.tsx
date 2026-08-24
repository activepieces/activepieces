import { Permission } from '@activepieces/core-utils';
import {
  ApEdition,
  ApFlagId,
  isNil,
  PlatformRole,
  PROJECT_COLOR_PALETTE,
  ProjectType,
  ProjectWithLimits,
  TemplateTelemetryEventType,
} from '@activepieces/shared';
import { useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import {
  Bot,
  ChartLine,
  ChevronsUpDown,
  Compass,
  Lock,
  LogOut,
  PanelLeftClose,
  PinOff,
  Search,
  Settings,
  Shield,
  SlidersHorizontal,
  SquarePen,
  UserCogIcon,
} from 'lucide-react';
import { ComponentType, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { UserAvatar } from '@/components/custom/user-avatar';
import { useEmbedding } from '@/components/providers/embed-provider';
import { useTelemetry } from '@/components/providers/telemetry-provider';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { SidebarUsageLimits } from '@/features/billing';
import { chatUtils } from '@/features/chat/lib/chat-utils';
import {
  CreateProjectButton,
  getProjectName,
  PlatformSwitcher,
  projectCollectionUtils,
} from '@/features/projects';
import { templatesTelemetryApi } from '@/features/templates';
import { usePinnedProjects } from '@/features/workspace/lib/pinned-projects';
import { useRailCollapsed } from '@/features/workspace/lib/rail-collapsed';
import {
  useAuthorization,
  useIsPlatformAdmin,
} from '@/hooks/authorization-hooks';
import { flagsHooks } from '@/hooks/flags-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { userHooks } from '@/hooks/user-hooks';
import { authenticationSession } from '@/lib/authentication-session';
import { cn } from '@/lib/utils';

import AccountSettingsDialog from '../account-settings';
import { useGlobalSearch } from '../global-search/global-search-context';
import { HelpAndFeedback } from '../help-and-feedback';

export function PrimaryRail() {
  const { embedState } = useEmbedding();
  const { platform } = platformHooks.useCurrentPlatform();
  const { checkAccess } = useAuthorization();
  const { data: currentUser } = userHooks.useCurrentUser();
  const {
    collapsed,
    setCollapsed,
    toggle: toggleCollapsed,
  } = useRailCollapsed();

  if (embedState.isEmbedded || embedState.hideSideNav) {
    return null;
  }

  const showAgents =
    platform.plan.agentsEnabled && checkAccess(Permission.READ_AGENT);

  const openSidebar = () => setCollapsed(false);

  return (
    <TooltipProvider delayDuration={300}>
      <div
        onClick={collapsed ? openSidebar : undefined}
        title={collapsed ? t('Open sidebar') : undefined}
        className={cn(
          'flex h-svh shrink-0 flex-col bg-sidebar py-3 transition-[width] duration-150',
          collapsed ? 'w-14 cursor-ew-resize items-center' : 'w-60',
        )}
      >
        <RailHeader collapsed={collapsed} onToggle={toggleCollapsed} />

        <div
          className={cn(
            'mt-2 flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto scrollbar-none',
            collapsed ? 'items-center px-2' : 'px-2',
          )}
        >
          {platform.plan.chatEnabled && (
            <RailNavButton
              collapsed={collapsed}
              to="/chat"
              icon={SquarePen}
              label={t('Chat')}
              isActive={({ pathname }) => pathname.startsWith('/chat')}
              onClick={() =>
                window.dispatchEvent(new Event(chatUtils.newChatEvent))
              }
            />
          )}
          {showAgents && (
            <RailNavButton
              collapsed={collapsed}
              to="/agents"
              icon={Bot}
              label={t('Agents')}
              isActive={({ pathname }) => pathname.startsWith('/agents')}
            />
          )}
          <RailNavButton
            collapsed={collapsed}
            to="/templates"
            icon={Compass}
            label={t('Explore')}
            isActive={({ pathname }) => pathname.startsWith('/templates')}
            onClick={() =>
              templatesTelemetryApi.sendEvent({
                eventType: TemplateTelemetryEventType.EXPLORE_VIEW,
                userId: currentUser?.id,
              })
            }
          />
          <RailNavButton
            collapsed={collapsed}
            to="/impact"
            icon={ChartLine}
            label={t('Impact')}
            isActive={({ pathname }) => pathname.startsWith('/impact')}
          />
          <RailPinnedProjects collapsed={collapsed} />
        </div>

        {!collapsed && (
          <div className="mx-2 mb-1">
            <SidebarUsageLimits />
          </div>
        )}
        <RailPlatformAdminButton collapsed={collapsed} />
        <RailAccountRow collapsed={collapsed} />
      </div>
    </TooltipProvider>
  );
}

function RailHeader({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  const branding = flagsHooks.useWebsiteBranding();
  const { setOpen: setSearchOpen } = useGlobalSearch();
  const { embedState } = useEmbedding();
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);
  const { platform: currentPlatform } = platformHooks.useCurrentPlatform();
  const showSwitcher = edition === ApEdition.CLOUD && !embedState.isEmbedded;

  if (collapsed) {
    return (
      <div className="flex flex-col items-center gap-1 px-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={onToggle}
              aria-label={t('Open sidebar')}
              className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-md hover:bg-sidebar-accent"
            >
              <img
                src={branding.logos.logoIconUrl}
                alt={branding.websiteName}
                className="size-5 shrink-0"
                draggable={false}
              />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">{t('Open sidebar')}</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setSearchOpen(true);
              }}
              aria-label={t('Search')}
              className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
            >
              <Search className="size-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">{t('Search')}</TooltipContent>
        </Tooltip>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 px-2">
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            to="/"
            className="flex size-9 shrink-0 items-center justify-center rounded-md hover:bg-sidebar-accent"
          >
            <img
              src={branding.logos.logoIconUrl}
              alt={branding.websiteName}
              className="size-5 shrink-0"
              draggable={false}
            />
          </Link>
        </TooltipTrigger>
        <TooltipContent side="right">{branding.websiteName}</TooltipContent>
      </Tooltip>

      {showSwitcher ? (
        <div className="min-w-0 flex-1">
          <PlatformSwitcher>
            <button
              type="button"
              className="flex h-9 w-full items-center gap-2 rounded-md px-2 text-left hover:bg-sidebar-accent"
            >
              <span className="flex-1 truncate text-sm font-medium">
                {currentPlatform?.name ?? t('platform')}
              </span>
              <ChevronsUpDown className="ml-auto size-3 shrink-0" />
            </button>
          </PlatformSwitcher>
        </div>
      ) : (
        <h1 className="min-w-0 flex-1 truncate text-sm font-medium">
          {branding.websiteName}
        </h1>
      )}

      <div className="flex shrink-0 items-center gap-0.5">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 shrink-0 rounded-full text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              onClick={() => setSearchOpen(true)}
              aria-label={t('Search')}
            >
              <Search className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">{t('Search')}</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 shrink-0 rounded-full text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              onClick={onToggle}
              aria-label={t('Close sidebar')}
            >
              <PanelLeftClose className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">{t('Close sidebar')}</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}

function RailPlatformAdminButton({ collapsed }: { collapsed: boolean }) {
  const showPlatformAdmin = useIsPlatformAdmin();
  const { embedState } = useEmbedding();

  if (embedState.isEmbedded || !showPlatformAdmin) {
    return null;
  }

  return (
    <div className={cn('px-2 pb-1', collapsed && 'flex justify-center')}>
      <RailNavButton
        collapsed={collapsed}
        to="/platform/projects"
        icon={Shield}
        label={t('Platform Admin')}
        isActive={({ pathname }) => pathname.startsWith('/platform')}
      />
    </div>
  );
}

function RailNavButton({
  collapsed,
  to,
  icon: Icon,
  label,
  isActive,
  onClick,
}: {
  collapsed: boolean;
  to: string;
  icon: ComponentType<{ className?: string }>;
  label: string;
  isActive: (location: { pathname: string; search: string }) => boolean;
  onClick?: () => void;
}) {
  const location = useLocation();
  const active = isActive(location);

  const link = (
    <Link
      to={to}
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      className={cn(
        'flex items-center gap-3 rounded-full text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground',
        collapsed ? 'size-9 cursor-pointer justify-center' : 'h-10 px-3',
        active && 'bg-sidebar-accent font-medium text-sidebar-foreground',
      )}
    >
      <Icon className={cn('size-[18px] shrink-0', active && 'text-primary')} />
      {!collapsed && <span className="truncate">{label}</span>}
    </Link>
  );

  if (!collapsed) {
    return link;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  );
}

function RailPinnedProjects({ collapsed }: { collapsed: boolean }) {
  const { pinnedIds, unpin, showAll, setShowAll } = usePinnedProjects();
  const { data: projects } = projectCollectionUtils.useAll();
  const { platform } = platformHooks.useCurrentPlatform();
  const { data: currentUser } = userHooks.useCurrentUser();
  const location = useLocation();
  const navigate = useNavigate();
  const showCreateProject =
    platform.plan.billedTeamProjectsLimit !== 0 &&
    currentUser?.platformRole === PlatformRole.ADMIN;
  const [sort, setSort] = useState<PinnedSort>(() =>
    readStoredSort(localStorage.getItem(PINNED_SORT_KEY)),
  );

  const changeSort = (next: PinnedSort) => {
    setSort(next);
    localStorage.setItem(PINNED_SORT_KEY, next);
  };

  const pinned = pinnedIds
    .map((id) => projects.find((project) => project.id === id))
    .filter((project): project is NonNullable<typeof project> => !!project);
  const listingEverything = showAll || pinned.length === 0;
  const listed = listingEverything ? projects : pinned;

  if (listed.length === 0) {
    return null;
  }

  const sorted = sortPinnedProjects({
    projects: listed,
    pinnedIds,
    sort: listingEverything && sort === 'added' ? 'recency' : sort,
  });

  const openProject = (projectId: string) => {
    if (projectId !== authenticationSession.getProjectId()) {
      authenticationSession.switchToProject(projectId);
    }
    navigate(`/projects/${projectId}/automations`);
  };

  return (
    <div
      className={cn(
        'group/pinned mt-2 flex flex-col gap-0.5',
        collapsed && 'items-center',
      )}
    >
      <div
        className={cn(
          'mb-1 h-px bg-sidebar-border',
          collapsed ? 'w-6' : 'mx-3',
        )}
      />
      {!collapsed && (
        <div className="flex items-center gap-1 py-0.5 pl-3 pr-1">
          <span className="text-[11px] font-medium uppercase tracking-wide text-sidebar-foreground/50">
            {listingEverything ? t('Projects') : t('Pinned projects')}
          </span>
          <div className="ml-auto flex items-center gap-0.5">
            {showCreateProject && (
              <CreateProjectButton
                variant="icon"
                projects={projects ?? []}
                onCreate={(project) => {
                  navigate(`/projects/${project.id}/automations`);
                }}
              />
            )}
            <div className="opacity-0 transition-opacity group-hover/pinned:opacity-100">
              <PinnedSortMenu
                sort={sort}
                onChange={changeSort}
                showAll={listingEverything}
                onShowAllChange={setShowAll}
              />
            </div>
          </div>
        </div>
      )}
      {sorted.map((project) => {
        const name = getProjectName(project);
        const isTeam = project.type === ProjectType.TEAM;
        const palette =
          isTeam && project.icon
            ? PROJECT_COLOR_PALETTE[project.icon.color]
            : null;
        const active = location.pathname.includes(`/projects/${project.id}`);

        const badge = (
          <span
            className="flex size-[18px] shrink-0 items-center justify-center rounded-[4px] text-[10px] font-bold"
            style={
              palette
                ? { backgroundColor: palette.color, color: palette.textColor }
                : undefined
            }
          >
            {isTeam ? (
              name.charAt(0).toUpperCase()
            ) : (
              <Lock className="size-3 text-sidebar-foreground/70" />
            )}
          </span>
        );

        const row = (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              openProject(project.id);
            }}
            aria-label={name}
            className={cn(
              'group/pin flex items-center gap-3 rounded-full text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground',
              collapsed
                ? 'size-9 cursor-pointer justify-center'
                : 'h-9 w-full px-3',
              active && 'bg-sidebar-accent font-medium text-sidebar-foreground',
            )}
          >
            {badge}
            {!collapsed && (
              <>
                <span className="min-w-0 flex-1 truncate text-left">
                  {name}
                </span>
                {!showAll && (
                  <span
                    role="button"
                    tabIndex={0}
                    aria-label={t('Unpin')}
                    onClick={(e) => {
                      e.stopPropagation();
                      unpin(project.id);
                    }}
                    className="hidden shrink-0 rounded p-0.5 text-sidebar-foreground/60 hover:text-sidebar-foreground group-hover/pin:block"
                  >
                    <PinOff className="size-3.5" />
                  </span>
                )}
              </>
            )}
          </button>
        );

        if (!collapsed) {
          return <div key={project.id}>{row}</div>;
        }

        return (
          <Tooltip key={project.id}>
            <TooltipTrigger asChild>{row}</TooltipTrigger>
            <TooltipContent side="right">{name}</TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}

function PinnedSortMenu({
  sort,
  onChange,
  showAll,
  onShowAllChange,
}: {
  sort: PinnedSort;
  onChange: (next: PinnedSort) => void;
  showAll: boolean;
  onShowAllChange: (value: boolean) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={t('Sort pinned projects')}
        className="flex size-6 items-center justify-center rounded-md text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground data-[state=open]:bg-sidebar-accent"
      >
        <SlidersHorizontal className="size-3.5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="right" className="w-48">
        <PinnedMenuOption
          label={t('Recently added')}
          active={sort === 'added'}
          onClick={() => onChange('added')}
        />
        <PinnedMenuOption
          label={t('Recently used')}
          active={sort === 'recency'}
          onClick={() => onChange('recency')}
        />
        <PinnedMenuOption
          label={t('Alphabetical')}
          active={sort === 'alphabetical'}
          onClick={() => onChange('alphabetical')}
        />
        <DropdownMenuSeparator />
        <PinnedMenuOption
          label={t('Show all projects')}
          active={showAll}
          onClick={() => onShowAllChange(!showAll)}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function PinnedMenuOption({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <DropdownMenuItem onClick={onClick} className="justify-between">
      {label}
      {active && <span className="text-primary">✓</span>}
    </DropdownMenuItem>
  );
}

function readStoredSort(stored: string | null): PinnedSort {
  return PINNED_SORTS.find((sort) => sort === stored) ?? 'added';
}

function sortPinnedProjects({
  projects,
  pinnedIds,
  sort,
}: {
  projects: ProjectWithLimits[];
  pinnedIds: string[];
  sort: PinnedSort;
}): ProjectWithLimits[] {
  const copy = [...projects];
  if (sort === 'alphabetical') {
    return copy.sort((a, b) =>
      getProjectName(a).localeCompare(getProjectName(b)),
    );
  }
  if (sort === 'recency') {
    return copy.sort(
      (a, b) => new Date(b.updated).getTime() - new Date(a.updated).getTime(),
    );
  }
  return copy.sort((a, b) => pinnedIds.indexOf(b.id) - pinnedIds.indexOf(a.id));
}

function RailAccountRow({ collapsed }: { collapsed: boolean }) {
  const [accountSettingsOpen, setAccountSettingsOpen] = useState(false);
  const { data: user } = userHooks.useCurrentUser();
  const queryClient = useQueryClient();
  const { reset } = useTelemetry();
  const navigate = useNavigate();

  if (!user) {
    return null;
  }

  const handleLogout = () => {
    userHooks.invalidateCurrentUser(queryClient);
    authenticationSession.logOut();
    reset();
    navigate('/sign-in');
  };

  return (
    <div
      className={cn(
        'mt-2 flex items-center',
        collapsed ? 'flex-col-reverse gap-1' : 'justify-between px-2',
      )}
    >
      <DropdownMenu modal>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label={t('Account')}
                onClick={(e) => e.stopPropagation()}
                className={cn(
                  'flex items-center gap-2 rounded-full hover:bg-sidebar-accent',
                  collapsed
                    ? 'size-9 cursor-pointer justify-center'
                    : 'h-10 min-w-0 flex-1 px-2',
                )}
              >
                <div className="size-[22px] shrink-0 overflow-hidden rounded-full">
                  <UserAvatar
                    className={cn('size-full object-cover', {
                      'scale-150': isNil(user.imageUrl),
                    })}
                    name={user.firstName + ' ' + user.lastName}
                    email={user.email}
                    imageUrl={user.imageUrl}
                    size={22}
                    disableTooltip={true}
                  />
                </div>
                {!collapsed && (
                  <span className="min-w-0 flex-1 truncate text-left text-sm">
                    {user.firstName + ' ' + user.lastName}
                  </span>
                )}
              </button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          {collapsed && (
            <TooltipContent side="right">{t('Account')}</TooltipContent>
          )}
        </Tooltip>
        <DropdownMenuContent
          className="w-56 rounded-lg"
          side="right"
          align="end"
          sideOffset={10}
        >
          <DropdownMenuLabel className="p-0 font-normal">
            <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
              <div className="size-8 shrink-0 overflow-hidden rounded-full">
                <UserAvatar
                  className="size-full object-cover"
                  name={user.firstName + ' ' + user.lastName}
                  email={user.email}
                  imageUrl={user.imageUrl}
                  size={32}
                  disableTooltip={true}
                />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">
                  {user.firstName + ' ' + user.lastName}
                </span>
                <span className="truncate text-xs">{user.email}</span>
              </div>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={() => setAccountSettingsOpen(true)}>
              <UserCogIcon className="w-4 h-4 mr-2" />
              {t('Account Settings')}
            </DropdownMenuItem>
            <HelpAndFeedback />
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            {t('Log out')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 shrink-0 cursor-pointer rounded-full text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
            onClick={(e) => {
              e.stopPropagation();
              setAccountSettingsOpen(true);
            }}
            aria-label={t('Settings')}
          >
            <Settings className="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">{t('Settings')}</TooltipContent>
      </Tooltip>

      <AccountSettingsDialog
        open={accountSettingsOpen}
        onClose={() => setAccountSettingsOpen(false)}
      />
    </div>
  );
}

const PINNED_SORT_KEY = 'rail-pinned-sort';

const PINNED_SORTS = ['added', 'recency', 'alphabetical'] as const;

type PinnedSort = (typeof PINNED_SORTS)[number];
