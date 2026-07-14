import { t } from 'i18next';
import { MessageCircle, X } from 'lucide-react';
import { Outlet } from 'react-router-dom';

import { CollapsedSidebarToggle } from '@/components/custom/page-header';
import {
  StageHeaderActionsAnchor,
  StageHeaderAnchor,
  StageHeaderSlotProvider,
} from '@/components/custom/stage-header-slot';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { STAGE_DOCK_TARGET_ID } from '@/hooks/use-stage-scroll-container';
import { cn } from '@/lib/utils';

import { BrowserLiveView } from './browser-live-view';
import { StageBreadcrumb } from './stage-breadcrumb';
import { useStage } from './stage-context';
import { StageProjectActions } from './stage-project-actions';

const FULL_BLEED_TYPES = new Set(['flow', 'table', 'run']);

function StageHeaderBar({
  chatCollapsed,
  onShowChat,
  standalone,
  showSidebarToggle,
}: {
  chatCollapsed?: boolean;
  onShowChat?: () => void;
  standalone?: boolean;
  showSidebarToggle?: boolean;
}) {
  const { closeStage } = useStage();

  return (
    <div className="shrink-0 flex items-center gap-1.5 px-3 h-12 border-b">
      {showSidebarToggle && <CollapsedSidebarToggle />}
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
      <StageBreadcrumb />
      <StageHeaderAnchor className="flex min-w-0 items-center" />
      <div className="flex-1" />
      <StageProjectActions />
      <StageHeaderActionsAnchor className="flex min-w-0 items-center gap-1.5" />
      {!standalone && (
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
      )}
    </div>
  );
}

export function StageContainer({
  chatCollapsed,
  onShowChat,
  standalone,
  showSidebarToggle,
}: {
  chatCollapsed?: boolean;
  onShowChat?: () => void;
  standalone?: boolean;
  showSidebarToggle?: boolean;
}) {
  const {
    stageRef,
    current,
    browserView,
    dismissBrowserView,
    requestChatSend,
  } = useStage();
  const isFullBleed = FULL_BLEED_TYPES.has(current.type);
  // Re-mounts (and so re-fades) whenever the open resource changes, so navigating
  // between sections/pages cross-fades in instead of hard-cutting.
  const contentKey =
    'id' in current ? `${current.type}:${current.id}` : current.type;

  return (
    <StageHeaderSlotProvider>
      <div
        id={STAGE_DOCK_TARGET_ID}
        className="relative flex flex-col h-full w-full bg-background overflow-hidden"
      >
        <StageHeaderBar
          chatCollapsed={chatCollapsed}
          onShowChat={onShowChat}
          standalone={standalone}
          showSidebarToggle={showSidebarToggle}
        />
        <div
          ref={stageRef}
          id="dashboard-content-container"
          className={cn(
            'relative flex-1 min-h-0',
            isFullBleed ? 'overflow-hidden' : 'overflow-auto',
          )}
        >
          <div
            key={contentKey}
            className={cn(
              'w-full animate-stage-enter',
              isFullBleed ? 'h-full' : 'min-h-full',
            )}
          >
            <Outlet />
          </div>
          {browserView && (
            <BrowserLiveView
              data={browserView}
              onDismiss={dismissBrowserView}
              onContinue={() =>
                requestChatSend(
                  t(
                    "I've done my part in the browser — please check the page and continue.",
                  ),
                )
              }
            />
          )}
        </div>
      </div>
    </StageHeaderSlotProvider>
  );
}
