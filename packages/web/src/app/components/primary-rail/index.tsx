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
import { t } from 'i18next';
import {
  Bot,
  ChartLine,
  ChevronsUpDown,
  Compass,
  Lock,
  PanelLeftClose,
  Search,
  Shield,
  SlidersHorizontal,
  SquarePen,
  Unplug,
} from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { ComponentType, ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { LogoPlate } from '@/components/custom/logo-plate';
import { useEmbedding } from '@/components/providers/embed-provider';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useAgentsNavVisible } from '@/features/agents';
import { SidebarUsageLimits } from '@/features/billing';
import { chatUtils } from '@/features/chat/lib/chat-utils';
import {
  CreateProjectButton,
  getProjectName,
  PlatformSwitcher,
  projectCollectionUtils,
} from '@/features/projects';
import { templatesTelemetryApi } from '@/features/templates';
import { useIsPlatformAdmin } from '@/hooks/authorization-hooks';
import { flagsHooks } from '@/hooks/flags-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { userHooks } from '@/hooks/user-hooks';
import { authenticationSession } from '@/lib/authentication-session';
import { cn } from '@/lib/utils';

import { MCP_CLIENT_BRANDING } from '../../routes/mcp-server/mcp-client-display';
import { recordAccess } from '../global-search/access-history';
import { useGlobalSearch } from '../global-search/global-search-context';
import { mcpHooks } from '../project-settings/mcp-server/utils/mcp-hooks';
import { SidebarUser } from '../sidebar/sidebar-user';

export function PrimaryRail() {
  const { embedState } = useEmbedding();
  const { platform } = platformHooks.useCurrentPlatform();
  const { data: currentUser } = userHooks.useCurrentUser();
  const { state, setOpen } = useSidebar();
  const collapsed = state === 'collapsed';
  const showAgents = useAgentsNavVisible();
  const isRailHidden = embedState.isEmbedded || embedState.hideSideNav;
  const { reachesMcp } = mcpHooks.useMcpReach({ enabled: !isRailHidden });

  if (isRailHidden) {
    return null;
  }

  return (
    <Sidebar
      collapsible="icon"
      onClick={
        collapsed
          ? (event) => {
              if (
                event.target instanceof Element &&
                event.target.closest('a,button')
              ) {
                return;
              }
              setOpen(true);
            }
          : undefined
      }
    >
      <RailHeader />
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {platform.plan.chatEnabled && (
              <RailNavItem
                to="/chat"
                icon={SquarePen}
                label={t('Chat')}
                onClick={() =>
                  window.dispatchEvent(new Event(chatUtils.newChatEvent))
                }
              />
            )}
            {reachesMcp && (
              <RailNavItem
                to="/mcp-server"
                icon={Unplug}
                label={t('MCP server')}
                badge={<McpClientMarks />}
              />
            )}
            {showAgents && (
              <RailNavItem to="/agents" icon={Bot} label={t('Agents')} />
            )}
            <RailNavItem
              to="/templates"
              icon={Compass}
              label={t('Explore')}
              onClick={() =>
                templatesTelemetryApi.sendEvent({
                  eventType: TemplateTelemetryEventType.EXPLORE_VIEW,
                  userId: currentUser?.id,
                })
              }
            />
            <RailNavItem to="/impact" icon={ChartLine} label={t('Impact')} />
          </SidebarMenu>
        </SidebarGroup>
        <RailProjects />
      </SidebarContent>
      <SidebarFooter>
        {!collapsed && <SidebarUsageLimits />}
        <RailPlatformAdminItem />
        <SidebarUser />
      </SidebarFooter>
    </Sidebar>
  );
}

function RailHeader() {
  const branding = flagsHooks.useWebsiteBranding();
  const { setOpen: setSearchOpen } = useGlobalSearch();
  const { embedState } = useEmbedding();
  const { state, toggleSidebar } = useSidebar();
  const collapsed = state === 'collapsed';
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);
  const { platform: currentPlatform } = platformHooks.useCurrentPlatform();
  const showSwitcher = edition === ApEdition.CLOUD && !embedState.isEmbedded;

  const logo = (
    <img
      src={branding.logos.logoIconUrl}
      alt={branding.websiteName}
      className="size-4 shrink-0"
      draggable={false}
    />
  );

  if (collapsed) {
    return (
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip={t('Open sidebar')}
              aria-label={t('Open sidebar')}
              onClick={(event) => {
                event.stopPropagation();
                toggleSidebar();
              }}
            >
              {logo}
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip={t('Search')}
              aria-label={t('Search')}
              onClick={(event) => {
                event.stopPropagation();
                setSearchOpen(true);
              }}
            >
              <Search />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
    );
  }

  return (
    <SidebarHeader className="flex-row items-center gap-1">
      <SidebarMenu className="min-w-0 flex-1">
        <SidebarMenuItem>
          {showSwitcher ? (
            <PlatformSwitcher>
              <SidebarMenuButton className="font-medium">
                {logo}
                <span>{currentPlatform?.name ?? t('platform')}</span>
                <ChevronsUpDown className="ml-auto text-gray-11" />
              </SidebarMenuButton>
            </PlatformSwitcher>
          ) : (
            <SidebarMenuButton asChild className="font-medium">
              <Link to="/">
                {logo}
                <span>{branding.websiteName}</span>
              </Link>
            </SidebarMenuButton>
          )}
        </SidebarMenuItem>
      </SidebarMenu>
      <RailIconButton
        label={t('Search')}
        icon={Search}
        onClick={() => setSearchOpen(true)}
      />
      <RailIconButton
        label={t('Close sidebar')}
        icon={PanelLeftClose}
        onClick={toggleSidebar}
      />
    </SidebarHeader>
  );
}

function RailIconButton({
  label,
  icon: Icon,
  onClick,
}: {
  label: string;
  icon: ComponentType<{ className?: string }>;
  onClick: () => void;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          className="text-gray-11"
          onClick={onClick}
          aria-label={label}
        >
          <Icon />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  );
}

function RailNavItem({
  to,
  activePrefix = to,
  icon: Icon,
  label,
  badge,
  onClick,
}: {
  to: string;
  activePrefix?: string;
  icon: ComponentType<{ className?: string }>;
  label: string;
  badge?: ReactNode;
  onClick?: () => void;
}) {
  const { pathname } = useLocation();

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={pathname.startsWith(activePrefix)}
        tooltip={label}
      >
        <Link
          to={to}
          onClick={(event) => {
            event.stopPropagation();
            onClick?.();
          }}
        >
          <Icon />
          <span className="min-w-0 flex-1 truncate">{label}</span>
          {badge}
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

function McpClientMarks() {
  return (
    <span
      aria-hidden
      className="relative ml-auto h-4 w-10 shrink-0 group-data-[collapsible=icon]:hidden"
    >
      {MCP_RAIL_CLIENTS.map((client, index) => (
        <LogoPlate
          key={client}
          size="xxs"
          src={MCP_CLIENT_BRANDING[client].icon}
          alt=""
          className={cn(
            'absolute top-0 rounded-md ring-2 ring-gray-2',
            MCP_RAIL_OFFSETS[index],
          )}
        />
      ))}
    </span>
  );
}

function RailPlatformAdminItem() {
  const showPlatformAdmin = useIsPlatformAdmin();
  const { embedState } = useEmbedding();

  if (embedState.isEmbedded || !showPlatformAdmin) {
    return null;
  }

  return (
    <SidebarMenu>
      <RailNavItem
        to="/platform/projects"
        activePrefix="/platform"
        icon={Shield}
        label={t('Platform admin')}
      />
    </SidebarMenu>
  );
}

function RailProjects() {
  const { data: projects } = projectCollectionUtils.useAll();
  const { platform } = platformHooks.useCurrentPlatform();
  const { data: currentUser } = userHooks.useCurrentUser();
  const location = useLocation();
  const navigate = useNavigate();
  const showCreateProject =
    platform.plan.billedTeamProjectsLimit !== 0 &&
    currentUser?.platformRole === PlatformRole.ADMIN;
  const [sort, setSort] = useState<ProjectSort>(() =>
    readStoredSort(localStorage.getItem(PROJECT_SORT_KEY)),
  );

  if (projects.length === 0) {
    return null;
  }

  const changeSort = (next: ProjectSort) => {
    setSort(next);
    localStorage.setItem(PROJECT_SORT_KEY, next);
  };

  const openProject = ({
    projectId,
    name,
  }: {
    projectId: string;
    name: string;
  }) => {
    recordAccess({
      id: `project-${projectId}`,
      type: 'project',
      label: name,
      href: `/projects/${projectId}/automations`,
    });
    if (projectId !== authenticationSession.getProjectId()) {
      authenticationSession.switchToProject(projectId);
    }
    navigate(`/projects/${projectId}/automations`);
  };

  return (
    <>
      <SidebarSeparator />
      <SidebarGroup className="min-h-0 flex-1">
        <div className="flex h-7 shrink-0 items-center gap-1 pl-2 group-data-[collapsible=icon]:hidden">
          <span className="flex-1 truncate text-xs font-medium text-gray-11">
            {t('Projects')}
          </span>
          {showCreateProject && (
            <CreateProjectButton
              variant="icon"
              projects={projects ?? []}
              className="text-gray-11"
              onCreate={(project) => {
                navigate(`/projects/${project.id}/automations`);
              }}
            />
          )}
          <ProjectSortMenu sort={sort} onChange={changeSort} />
        </div>
        <SidebarMenu className="min-h-0 flex-1 overflow-y-auto">
          {orderProjects({ projects, sort }).map((project) => (
            <ProjectItem
              key={project.id}
              project={project}
              active={location.pathname.includes(`/projects/${project.id}`)}
              onOpen={openProject}
            />
          ))}
        </SidebarMenu>
      </SidebarGroup>
    </>
  );
}

function ProjectItem({
  project,
  active,
  onOpen,
}: {
  project: ProjectWithLimits;
  active: boolean;
  onOpen: (params: { projectId: string; name: string }) => void;
}) {
  const prefersReducedMotion = useReducedMotion();
  const name = getProjectName(project);
  const isTeam = project.type === ProjectType.TEAM;
  const palette =
    isTeam && project.icon ? PROJECT_COLOR_PALETTE[project.icon.color] : null;

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={active} tooltip={name}>
        <motion.button
          layout={!prefersReducedMotion}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onOpen({ projectId: project.id, name });
          }}
        >
          <span
            className="flex size-4 shrink-0 items-center justify-center rounded-md bg-gray-4 text-xs font-semibold"
            style={
              palette
                ? { backgroundColor: palette.color, color: palette.textColor }
                : undefined
            }
          >
            {isTeam ? (
              name.charAt(0).toUpperCase()
            ) : (
              <Lock className="size-3.5! text-gray-11" />
            )}
          </span>
          <span>{name}</span>
        </motion.button>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

function ProjectSortMenu({
  sort,
  onChange,
}: {
  sort: ProjectSort;
  onChange: (next: ProjectSort) => void;
}) {
  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-xs"
              className="text-gray-11"
              aria-label={t('Sort pinned projects')}
            >
              <SlidersHorizontal />
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent side="right">
          {t('Sort pinned projects')}
        </TooltipContent>
      </Tooltip>
      <DropdownMenuContent side="right" className="w-56">
        <DropdownMenuRadioGroup
          value={sort}
          onValueChange={(value) => onChange(readStoredSort(value))}
        >
          <DropdownMenuRadioItem value="added">
            {t('Recently added')}
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="recency">
            {t('Recently used')}
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="alphabetical">
            {t('Alphabetical')}
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function readStoredSort(stored: string | null): ProjectSort {
  return PROJECT_SORTS.find((sort) => sort === stored) ?? 'added';
}

function lastFlowUpdatedAt(project: ProjectWithLimits): number {
  const lastFlowUpdated = project.analytics.lastFlowUpdated;
  if (isNil(lastFlowUpdated)) {
    return 0;
  }
  return new Date(lastFlowUpdated).getTime();
}

function compareProjects({ sort }: { sort: ProjectSort }) {
  return (a: ProjectWithLimits, b: ProjectWithLimits): number => {
    if (sort === 'alphabetical') {
      return getProjectName(a).localeCompare(getProjectName(b));
    }
    if (sort === 'added') {
      return new Date(b.created).getTime() - new Date(a.created).getTime();
    }
    const flowA = lastFlowUpdatedAt(a);
    const flowB = lastFlowUpdatedAt(b);
    if (flowA !== flowB) {
      return flowB - flowA;
    }
    return new Date(b.updated).getTime() - new Date(a.updated).getTime();
  };
}

function orderProjects({
  projects,
  sort,
}: {
  projects: ProjectWithLimits[];
  sort: ProjectSort;
}): ProjectWithLimits[] {
  const compare = compareProjects({ sort });
  const personal = projects.filter(
    (project) => project.type !== ProjectType.TEAM,
  );
  const others = projects.filter(
    (project) => project.type === ProjectType.TEAM,
  );
  return [...personal.sort(compare), ...others.sort(compare)];
}

const MCP_RAIL_CLIENTS = ['claude', 'chatgpt', 'cursor'] as const;

const MCP_RAIL_OFFSETS = ['left-0', 'left-3', 'left-6'];

const PROJECT_SORT_KEY = 'rail-pinned-sort';

const PROJECT_SORTS = ['added', 'recency', 'alphabetical'] as const;

type ProjectSort = (typeof PROJECT_SORTS)[number];
