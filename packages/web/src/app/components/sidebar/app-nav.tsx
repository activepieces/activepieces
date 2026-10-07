import {
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
  Compass,
  Lock,
  Shield,
  SlidersHorizontal,
  SquarePen,
  Unplug,
} from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { LogoPlate } from '@/components/custom/logo-plate';
import { useEmbedding } from '@/components/providers/embed-provider';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from '@/components/ui/sidebar-shadcn';
import { useAgentsNavVisible } from '@/features/agents';
import { chatUtils } from '@/features/chat/lib/chat-utils';
import {
  CreateProjectButton,
  getProjectName,
  projectCollectionUtils,
} from '@/features/projects';
import { templatesTelemetryApi } from '@/features/templates';
import { useIsPlatformAdmin } from '@/hooks/authorization-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { userHooks } from '@/hooks/user-hooks';
import { authenticationSession } from '@/lib/authentication-session';
import { cn } from '@/lib/utils';

import { MCP_CLIENT_BRANDING } from '../../routes/mcp-server/mcp-client-display';
import { recordAccess } from '../global-search/access-history';
import { mcpHooks } from '../project-settings/mcp-server/utils/mcp-hooks';

import { ApSidebarItem } from './ap-sidebar-item';
import { sidebarStyles } from './sidebar-styles';

export function AppNav() {
  const { data: currentUser } = userHooks.useCurrentUser();
  const showAgents = useAgentsNavVisible();

  return (
    <>
      <DriversGroup />
      <SidebarGroup>
        <SidebarMenu>
          {showAgents && (
            <ApSidebarItem
              type="link"
              to="/agents"
              icon={Bot}
              label={t('Agents')}
            />
          )}
          <ApSidebarItem
            type="link"
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
          <ApSidebarItem
            type="link"
            to="/impact"
            icon={ChartLine}
            label={t('Impact')}
          />
        </SidebarMenu>
      </SidebarGroup>
      <ProjectsGroup />
    </>
  );
}

function DriversGroup() {
  const { platform } = platformHooks.useCurrentPlatform();
  const { reachesMcp } = mcpHooks.useMcpReach({ enabled: true });
  const showChat = platform.plan.chatEnabled;

  if (!showChat && !reachesMcp) {
    return null;
  }

  return (
    <>
      <SidebarGroup className="pb-1">
        <SidebarMenu>
          {showChat && (
            <ApSidebarItem
              type="link"
              to="/chat"
              icon={SquarePen}
              label={t('Chat')}
              onClick={() =>
                window.dispatchEvent(new Event(chatUtils.newChatEvent))
              }
            />
          )}
          {reachesMcp && (
            <ApSidebarItem
              type="link"
              to="/mcp-server"
              icon={Unplug}
              label={t('MCP')}
              badge={<McpClientLogos />}
            />
          )}
        </SidebarMenu>
      </SidebarGroup>
      <SidebarSeparator className="mx-4 my-1" />
    </>
  );
}

export function PlatformAdminNavItem() {
  const showPlatformAdmin = useIsPlatformAdmin();
  const { embedState } = useEmbedding();

  if (embedState.isEmbedded || !showPlatformAdmin) {
    return null;
  }

  return (
    <>
      <SidebarSeparator className="mx-2 my-1" />
      <SidebarMenu className="pb-1">
        <ApSidebarItem
          type="link"
          to="/platform/projects"
          activeOn="/platform"
          icon={Shield}
          label={t('Platform Admin')}
        />
      </SidebarMenu>
    </>
  );
}

function McpClientLogos() {
  return (
    <span aria-hidden className="ml-auto flex shrink-0 items-center gap-0.5">
      {MCP_SIDEBAR_CLIENTS.map((client) => (
        <LogoPlate
          key={client}
          size="xxs"
          src={MCP_CLIENT_BRANDING[client].icon}
          alt=""
          className="size-4.5 rounded-md border border-gray-6"
          innerClassName="p-px"
        />
      ))}
    </span>
  );
}

function ProjectsGroup() {
  const { data: projects } = projectCollectionUtils.useAll();
  const { platform } = platformHooks.useCurrentPlatform();
  const { data: currentUser } = userHooks.useCurrentUser();
  const location = useLocation();
  const navigate = useNavigate();
  const { state, isMobile } = useSidebar();
  const isCollapsed = state === 'collapsed' && !isMobile;
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
      <SidebarSeparator className="mx-4" />
      <SidebarGroup className="min-h-0 flex-1">
        <div
          inert={isCollapsed}
          className={cn('shrink-0', sidebarStyles.hideWhenCollapsed)}
        >
          <div className="min-h-0 overflow-hidden">
            <div className="flex h-7 items-center gap-0.5 pl-2">
              <span className="flex-1 truncate text-xs font-medium text-gray-11">
                {t('Projects')}
              </span>
              {showCreateProject && (
                <CreateProjectButton
                  variant="icon"
                  projects={projects ?? []}
                  className={PROJECTS_HEADER_ICON_BUTTON}
                  onCreate={(project) => {
                    navigate(`/projects/${project.id}/automations`);
                  }}
                />
              )}
              <ProjectSortMenu sort={sort} onChange={changeSort} />
            </div>
          </div>
        </div>
        <SidebarMenu
          className={cn(
            'min-h-0 flex-1 gap-0.5',
            sidebarStyles.scrollArea,
            sidebarStyles.fadeEdges,
          )}
        >
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
  const { isMobile, setOpenMobile } = useSidebar();
  const name = getProjectName(project);
  const isTeam = project.type === ProjectType.TEAM;
  const palette =
    isTeam && project.icon ? PROJECT_COLOR_PALETTE[project.icon.color] : null;

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={active} tooltip={name}>
        <motion.button
          layout={prefersReducedMotion ? false : 'position'}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          type="button"
          aria-label={name}
          onClick={(event) => {
            event.stopPropagation();
            if (isMobile) {
              setOpenMobile(false);
            }
            onOpen({ projectId: project.id, name });
          }}
        >
          <span
            className="flex size-4 shrink-0 items-center justify-center rounded-sm text-xss font-bold leading-none"
            style={
              palette
                ? { backgroundColor: palette.color, color: palette.textColor }
                : undefined
            }
          >
            {isTeam ? (
              name.charAt(0).toUpperCase()
            ) : (
              <Lock className="size-3! text-gray-11" />
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
      <DropdownMenuTrigger
        aria-label={t('Sort pinned projects')}
        className={cn(
          PROJECTS_HEADER_ICON_BUTTON,
          'flex items-center justify-center data-[state=open]:bg-gray-5',
        )}
      >
        <SlidersHorizontal />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        side="right"
        className={cn('w-48', sidebarStyles.menuSurface)}
      >
        <SortOption
          label={t('Recently added')}
          active={sort === 'added'}
          onClick={() => onChange('added')}
        />
        <SortOption
          label={t('Recently used')}
          active={sort === 'recency'}
          onClick={() => onChange('recency')}
        />
        <SortOption
          label={t('Alphabetical')}
          active={sort === 'alphabetical'}
          onClick={() => onChange('alphabetical')}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function SortOption({
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
      {active && <span className="text-accent-11">✓</span>}
    </DropdownMenuItem>
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

const MCP_SIDEBAR_CLIENTS = ['claude', 'chatgpt', 'cursor'] as const;

const PROJECTS_HEADER_ICON_BUTTON =
  'size-6 rounded-md text-gray-11 hover:bg-gray-4 hover:text-gray-12 [&_svg]:size-3.5!';

const PROJECT_SORT_KEY = 'rail-pinned-sort';

const PROJECT_SORTS = ['added', 'recency', 'alphabetical'] as const;

type ProjectSort = (typeof PROJECT_SORTS)[number];
