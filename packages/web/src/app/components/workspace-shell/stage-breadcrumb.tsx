import { PROJECT_COLOR_PALETTE } from '@activepieces/shared';
import { t } from 'i18next';
import { Check, ChevronDown, ChevronRight } from 'lucide-react';
import { useLocation } from 'react-router-dom';

import {
  stageResourceKey,
  useStageHeaderSlot,
} from '@/components/custom/stage-header-slot';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getProjectName, projectCollectionUtils } from '@/features/projects';
import { cn } from '@/lib/utils';

import { StageResource, useStage } from './stage-context';
import { ProjectNavItem, useProjectNavItems } from './use-project-nav-items';

type SectionInfo = {
  label: string;
  // The list resource this section corresponds to — the target for the section
  // caret dropdown, the back-to-list link on detail pages, and the landing page
  // when switching projects.
  resource: StageResource;
  // Detail resources (flow/table/run/release) render a trailing leaf. Flow/table
  // are parented to the project home (Automations) and need no section crumb;
  // run/release are parented to their real section and render an up-link to it.
  isDetail: boolean;
};

// Maps the open resource to its second-level section. Detail resources resolve to
// their parent list.
function resolveSection(resource: StageResource): SectionInfo | null {
  switch (resource.type) {
    case 'automations':
      return {
        label: t('Automations'),
        resource: { type: 'automations' },
        isDetail: false,
      };
    case 'flow':
    case 'table':
      return {
        label: t('Automations'),
        resource: { type: 'automations' },
        isDetail: true,
      };
    case 'runs':
      return { label: t('Runs'), resource: { type: 'runs' }, isDetail: false };
    case 'run':
      return { label: t('Runs'), resource: { type: 'runs' }, isDetail: true };
    case 'connections':
      return {
        label: t('Connections'),
        resource: { type: 'connections' },
        isDetail: false,
      };
    case 'variables':
      return {
        label: t('Variables'),
        resource: { type: 'variables' },
        isDetail: false,
      };
    case 'releases':
      return {
        label: t('Releases'),
        resource: { type: 'releases' },
        isDetail: false,
      };
    case 'release':
      return {
        label: t('Releases'),
        resource: { type: 'releases' },
        isDetail: true,
      };
    case 'settings':
      return {
        label: t('Settings'),
        resource: { type: 'settings' },
        isDetail: false,
      };
    case 'none':
    default:
      return null;
  }
}

function sectionPathSegment(resource: StageResource | undefined): string {
  switch (resource?.type) {
    case 'runs':
      return '/runs';
    case 'connections':
      return '/connections';
    case 'variables':
      return '/variables';
    case 'releases':
      return '/releases';
    case 'settings':
      return '/settings';
    case 'automations':
    default:
      return '/automations';
  }
}

function detailLeafLabel(resource: StageResource): string {
  switch (resource.type) {
    case 'flow':
      return t('Flow');
    case 'table':
      return t('Table');
    case 'run':
      return t('Run');
    case 'release':
      return t('Release');
    default:
      return '';
  }
}

export function StageBreadcrumb() {
  const { current } = useStage();
  if (current.type === 'none') {
    return null;
  }
  return <StageBreadcrumbInner />;
}

// The project crumb: a single hover unit joining the project avatar and name. The
// avatar cross-fades to a caret on hover to signal it switches the project (that is
// the ONLY place a project switch lives); clicking the name goes to the project home
// (Automations). Both parts share one hover highlight so they read as one item.
function ProjectUnit({
  project,
  allProjects,
  isHome,
  onHome,
  onSwitchProject,
}: {
  project: StageProject;
  allProjects: StageProject[];
  isHome: boolean;
  onHome: () => void;
  onSwitchProject: (targetProjectId: string) => void;
}) {
  const projectName = getProjectName(project);
  const palette = PROJECT_COLOR_PALETTE[project.icon.color];

  return (
    <div className="group flex shrink-0 items-center rounded-md transition-colors hover:bg-accent">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label={t('Switch project')}
            className="flex size-7 shrink-0 items-center justify-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {/* The colored monogram square is always present; only its content
                cross-fades (letter → caret) on hover, so the caret sits inside the
                same colored space rather than replacing it. */}
            <span
              className="relative flex size-5 shrink-0 items-center justify-center rounded-[6px]"
              style={{
                backgroundColor: palette.color,
                color: palette.textColor,
              }}
              aria-hidden
            >
              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold transition-opacity group-hover:opacity-0">
                {projectName.charAt(0).toUpperCase()}
              </span>
              <span className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
                <ChevronDown className="size-3.5" />
              </span>
            </span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-[210px]">
          {allProjects.map((p) => {
            const pal = p.icon ? PROJECT_COLOR_PALETTE[p.icon.color] : null;
            const name = getProjectName(p);
            return (
              <DropdownMenuItem
                key={p.id}
                onSelect={() => onSwitchProject(p.id)}
              >
                <span
                  className="flex size-5 shrink-0 items-center justify-center rounded-[6px] text-[10px] font-bold"
                  style={{
                    backgroundColor: pal?.color,
                    color: pal?.textColor,
                  }}
                  aria-hidden
                >
                  {name.charAt(0).toUpperCase()}
                </span>
                <span className="min-w-0 flex-1 truncate">{name}</span>
                {p.id === project.id && (
                  <Check className="size-4 shrink-0 text-primary" />
                )}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      <button
        type="button"
        onClick={onHome}
        className={cn(
          'flex h-7 min-w-0 items-center rounded-md pr-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          isHome
            ? 'font-medium text-foreground'
            : 'text-muted-foreground group-hover:text-foreground',
        )}
      >
        <span className="truncate">{projectName}</span>
      </button>
    </div>
  );
}

// The current second-level section (Connections / Runs / …) rendered as a caret
// dropdown: the other sections collapse behind it so the user can switch section or
// jump home in one click. Project switching is intentionally NOT here — it lives only
// in the leading project avatar/caret.
function SectionCrumb({
  activeSection,
  navItems,
  onOpen,
}: {
  activeSection: SectionInfo;
  navItems: ProjectNavItem[];
  onOpen: (resource: StageResource) => void;
}) {
  const activeType = activeSection.resource.type;
  const ActiveIcon = navItems.find(
    (item) => item.resource.type === activeType,
  )?.Icon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            PILL_CLASS,
            'font-medium text-foreground hover:bg-accent data-[state=open]:bg-accent',
          )}
        >
          {ActiveIcon && <ActiveIcon size={16} className="shrink-0" />}
          <span className="truncate">{activeSection.label}</span>
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[200px]">
        {navItems.map((item) => {
          const isActive = item.resource.type === activeType;
          return (
            <DropdownMenuItem
              key={item.key}
              onSelect={() => onOpen(item.resource)}
            >
              <item.Icon size={16} className="shrink-0" />
              <span className="min-w-0 flex-1 truncate">{item.label}</span>
              {isActive && <Check className="size-4 shrink-0 text-primary" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// On the project home page the sections are shown inline as peer links (Automations
// is the home itself, so it is omitted) — the user lands on the hub and sees where
// they can go. They only collapse behind the SectionCrumb caret once inside a
// second-level page. Scrolls horizontally if the Stage is too narrow to fit them.
function SectionLinks({
  navItems,
  onOpen,
}: {
  navItems: ProjectNavItem[];
  onOpen: (resource: StageResource) => void;
}) {
  const items = navItems.filter((item) => item.resource.type !== 'automations');
  if (items.length === 0) {
    return null;
  }
  return (
    <div className="flex min-w-0 items-center gap-0.5 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          onClick={() => onOpen(item.resource)}
          className={cn(
            PILL_CLASS,
            'text-muted-foreground/80 hover:bg-accent hover:text-foreground',
          )}
        >
          <item.Icon size={16} className="shrink-0" />
          <span className="whitespace-nowrap">{item.label}</span>
        </button>
      ))}
    </div>
  );
}

function StageBreadcrumbInner() {
  const { current, open, activeProjectId } = useStage();
  const { search } = useLocation();
  const project = projectCollectionUtils.useProjectById(activeProjectId);
  const { data: allProjects = [] } = projectCollectionUtils.useAll();
  const navItems = useProjectNavItems();
  const headerSlot = useStageHeaderSlot();
  const titleCount = headerSlot?.titleCount ?? 0;
  const resourceTitles = headerSlot?.resourceTitles ?? {};

  if (!project) {
    return null;
  }

  const section = resolveSection(current);
  const isHome = current.type === 'automations';
  const parentIsHome = section?.resource.type === 'automations';
  const hasInjectedLeaf = titleCount > 0;
  const genericLeaf =
    resourceTitles[
      stageResourceKey(current.type, 'id' in current ? current.id : undefined)
    ] ?? detailLeafLabel(current);
  const UpLinkIcon = section
    ? navItems.find((item) => item.resource.type === section.resource.type)
        ?.Icon
    : undefined;

  const goHome = () => open({ type: 'automations' });

  // Switching project lands on the same second-level section in the target project
  // (a flow → its Automations home, a run → its Runs, …).
  const switchProject = (targetProjectId: string) => {
    if (targetProjectId === project.id) {
      return;
    }
    const chat = new URLSearchParams(search).get('chat');
    const target = `/projects/${targetProjectId}${sectionPathSegment(
      section?.resource,
    )}${chat ? `?chat=${chat}` : ''}`;
    projectCollectionUtils.setCurrentProject(targetProjectId, target);
  };

  return (
    <div className="flex min-w-0 items-center gap-1">
      <ProjectUnit
        project={project}
        allProjects={allProjects}
        isHome={isHome}
        onHome={goHome}
        onSwitchProject={switchProject}
      />

      {/* Home / project page — the sections are shown inline so they can be
          reached directly (they collapse behind the caret on second-level pages). */}
      {isHome && (
        <>
          <span className="mx-1 h-4 w-px shrink-0 bg-border" aria-hidden />
          <SectionLinks navItems={navItems} onOpen={open} />
        </>
      )}

      {/* Second-level list — the section caret dropdown. */}
      {section && !isHome && !section.isDetail && (
        <>
          <ChevronRight className="size-4 shrink-0 text-muted-foreground/50" />
          <SectionCrumb
            activeSection={section}
            navItems={navItems}
            onOpen={open}
          />
        </>
      )}

      {/* Detail page parented to the project home (flow / table) — the project
          name is the up-link, so we go straight to the leaf. */}
      {section && section.isDetail && parentIsHome && !hasInjectedLeaf && (
        <>
          <ChevronRight className="size-4 shrink-0 text-muted-foreground/50" />
          <span className="min-w-0 truncate text-sm font-semibold">
            {genericLeaf}
          </span>
        </>
      )}

      {/* Detail page parented to a real section (run / release) — up-link to the
          list, then the leaf. */}
      {section && section.isDetail && !parentIsHome && (
        <>
          <ChevronRight className="size-4 shrink-0 text-muted-foreground/50" />
          <button
            type="button"
            onClick={() => open(section.resource)}
            className={cn(
              PILL_CLASS,
              'text-muted-foreground hover:bg-accent hover:text-foreground',
            )}
          >
            {UpLinkIcon && <UpLinkIcon size={16} className="shrink-0" />}
            <span className="whitespace-nowrap">{section.label}</span>
          </button>
          <ChevronRight className="size-4 shrink-0 text-muted-foreground/50" />
          {!hasInjectedLeaf && (
            <span className="min-w-0 truncate text-sm font-semibold">
              {genericLeaf}
            </span>
          )}
        </>
      )}
    </div>
  );
}

const PILL_CLASS =
  'flex h-7 shrink-0 items-center gap-1.5 rounded-md px-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

type StageProject = NonNullable<
  ReturnType<typeof projectCollectionUtils.useProjectById>
>;
