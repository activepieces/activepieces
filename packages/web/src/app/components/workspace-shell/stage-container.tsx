import { t } from 'i18next';
import { ArrowLeft, MessageCircle, X } from 'lucide-react';
import { Outlet } from 'react-router-dom';

import {
  StageHeaderActionsAnchor,
  StageHeaderAnchor,
  StageHeaderSlotProvider,
  stageResourceKey,
  useStageHeaderSlot,
} from '@/components/custom/stage-header-slot';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { getProjectName, projectCollectionUtils } from '@/features/projects';
import { STAGE_DOCK_TARGET_ID } from '@/hooks/use-stage-scroll-container';
import { cn } from '@/lib/utils';

import { StageResource, useStage } from './stage-context';

const FULL_BLEED_TYPES = new Set(['flow', 'table', 'run']);

function StageDefaultTitle({ resource }: { resource: StageResource }) {
  const titleCount = useStageHeaderSlot()?.titleCount ?? 0;
  if (resource.type === 'none' || titleCount > 0) {
    return null;
  }
  return (
    <span className="min-w-0 truncate text-sm font-semibold">
      {stageResourceLabel(resource)}
    </span>
  );
}

function stageResourceLabel(resource: StageResource): string {
  switch (resource.type) {
    case 'flow':
      return t('Flow');
    case 'table':
      return t('Table');
    case 'run':
      return t('Run');
    case 'release':
      return t('Release');
    case 'automations':
      return t('Flows');
    case 'runs':
      return t('Runs');
    case 'connections':
      return t('Connections');
    case 'variables':
      return t('Variables');
    case 'releases':
      return t('Releases');
    case 'settings':
      return t('Settings');
    case 'none':
    default:
      return t('Back');
  }
}

function StageHeaderBar({
  chatCollapsed,
  onShowChat,
}: {
  chatCollapsed?: boolean;
  onShowChat?: () => void;
}) {
  const { current, back, canGoBack, previous, closeStage, activeProjectId } =
    useStage();
  const resourceTitles = useStageHeaderSlot()?.resourceTitles ?? {};
  const project = projectCollectionUtils.useProjectById(activeProjectId);
  const projectName = project ? getProjectName(project) : null;

  const previousKey = previous
    ? stageResourceKey(
        previous.type,
        'id' in previous ? previous.id : undefined,
      )
    : null;
  const backDestination = previous
    ? (previousKey && resourceTitles[previousKey]) ||
      stageResourceLabel(previous)
    : null;

  return (
    <div className="shrink-0 flex items-center gap-1.5 px-3 h-12 border-b">
      {chatCollapsed && onShowChat && (
        <TooltipProvider delayDuration={400}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={onShowChat}
              >
                <MessageCircle className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t('Show chat')}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
      {canGoBack && (
        <TooltipProvider delayDuration={400}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={back}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {backDestination
                ? projectName
                  ? t('Back to {project} › {page}', {
                      project: projectName,
                      page: backDestination,
                    })
                  : t('Back to {page}', { page: backDestination })
                : t('Back')}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
      <StageHeaderAnchor className="flex min-w-0 items-center" />
      <StageDefaultTitle resource={current} />
      {projectName && current.type !== 'none' && (
        <span className="flex shrink-0 items-center gap-1.5 text-sm text-muted-foreground">
          <span aria-hidden>·</span>
          <span className="max-w-[160px] truncate">{projectName}</span>
        </span>
      )}
      <div className="flex-1" />
      <StageHeaderActionsAnchor className="flex min-w-0 items-center gap-1.5" />
      <TooltipProvider delayDuration={400}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={closeStage}
            >
              <X className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t('Close')}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}

export function StageContainer({
  chatCollapsed,
  onShowChat,
  chromeless,
}: {
  chatCollapsed?: boolean;
  onShowChat?: () => void;
  chromeless?: boolean;
}) {
  const { stageRef, current } = useStage();
  const isFullBleed = FULL_BLEED_TYPES.has(current.type);

  return (
    <StageHeaderSlotProvider>
      <div
        id={STAGE_DOCK_TARGET_ID}
        className={cn(
          'relative flex flex-col h-full w-full bg-background overflow-hidden',
          !chromeless &&
            'rounded-xl border shadow-[2px_0px_4px_-2px_rgba(0,0,0,0.05),0px_2px_4px_-2px_rgba(0,0,0,0.05)]',
        )}
      >
        <StageHeaderBar chatCollapsed={chatCollapsed} onShowChat={onShowChat} />
        <div
          ref={stageRef}
          id="dashboard-content-container"
          className={cn(
            'relative flex-1 min-h-0',
            isFullBleed ? 'overflow-hidden' : 'overflow-auto',
          )}
        >
          <Outlet />
        </div>
      </div>
    </StageHeaderSlotProvider>
  );
}
