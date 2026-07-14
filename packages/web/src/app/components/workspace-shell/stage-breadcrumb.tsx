import { t } from 'i18next';

import {
  stageResourceKey,
  useStageHeaderSlot,
} from '@/components/custom/stage-header-slot';
import { Button } from '@/components/ui/button';

import { ProjectSwitcher } from '../project-layout/project-switcher';
import { SectionNavMenu } from '../project-layout/section-nav-menu';

import { StageResource, useStage } from './stage-context';

type SectionInfo = {
  label: string;
  // The list resource this section corresponds to — the target for the section
  // nav menu, the back-to-list link on detail pages, and the landing page
  // when switching projects.
  resource: StageResource;
  // Detail resources (flow/table/run/release) render the section as a plain
  // link back to its list, then the entity leaf.
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

function BreadcrumbSeparator() {
  return (
    <span className="text-sm font-normal text-muted-foreground/40">/</span>
  );
}

export function StageBreadcrumb() {
  const { current } = useStage();
  if (current.type === 'none') {
    return null;
  }
  return <StageBreadcrumbInner />;
}

// Mirrors the fork's header breadcrumbs: list pages get the hover section nav
// menu; detail pages get the section as a plain link back to its list, then the
// entity leaf (injected by the open resource's own header when available).
function StageBreadcrumbInner() {
  const { current, open } = useStage();
  const headerSlot = useStageHeaderSlot();
  const titleCount = headerSlot?.titleCount ?? 0;
  const resourceTitles = headerSlot?.resourceTitles ?? {};

  const section = resolveSection(current);
  const hasInjectedLeaf = titleCount > 0;
  const genericLeaf =
    resourceTitles[
      stageResourceKey(current.type, 'id' in current ? current.id : undefined)
    ] ?? detailLeafLabel(current);

  return (
    <div className="flex min-w-0 items-center gap-0.5">
      <ProjectSwitcher />

      {/* List page — the section title opens the hover quick-nav menu. */}
      {section && !section.isDetail && (
        <>
          <BreadcrumbSeparator />
          <SectionNavMenu label={section.label} />
        </>
      )}

      {/* Detail page — the section is a plain link back to its list, then the
          entity leaf. */}
      {section && section.isDetail && (
        <>
          <BreadcrumbSeparator />
          <Button
            variant="ghost"
            size="sm"
            className="h-auto shrink-0 rounded-md px-1.5 py-1 text-sm font-medium"
            onClick={() => open(section.resource)}
          >
            {section.label}
          </Button>
          <BreadcrumbSeparator />
          {!hasInjectedLeaf && (
            <div className="flex min-w-0 items-center text-sm font-medium">
              <span className="min-w-0 truncate">{genericLeaf}</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
