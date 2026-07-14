import { t } from 'i18next';
import { ChevronRight } from 'lucide-react';

import {
  stageResourceKey,
  useStageHeaderSlot,
} from '@/components/custom/stage-header-slot';
import { cn } from '@/lib/utils';

import { ProjectSwitcher } from '../project-layout/project-switcher';
import { SectionNavMenu } from '../project-layout/section-nav-menu';

import { StageResource, useStage } from './stage-context';
import { useProjectNavItems } from './use-project-nav-items';

type SectionInfo = {
  label: string;
  // The list resource this section corresponds to — the target for the section
  // nav menu, the back-to-list link on detail pages, and the landing page
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

function StageBreadcrumbInner() {
  const { current, open } = useStage();
  const navItems = useProjectNavItems();
  const headerSlot = useStageHeaderSlot();
  const titleCount = headerSlot?.titleCount ?? 0;
  const resourceTitles = headerSlot?.resourceTitles ?? {};

  const section = resolveSection(current);
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

  return (
    <div className="flex min-w-0 items-center gap-1">
      <ProjectSwitcher />

      {/* List page — the section title opens the hover quick-nav menu. */}
      {section && !section.isDetail && (
        <>
          <ChevronRight className="size-4 shrink-0 text-muted-foreground/50" />
          <SectionNavMenu label={section.label} />
        </>
      )}

      {/* Detail page parented to the project home (flow / table) — the section
          menu is the up-link, then the leaf. */}
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
