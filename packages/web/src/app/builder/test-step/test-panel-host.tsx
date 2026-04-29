import { FlowActionType, FlowTriggerType, isNil } from '@activepieces/shared';
import { useEffect, useRef, useState } from 'react';

import { useBuilderStateContext } from '@/app/builder/builder-hooks';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

import { FlowStepInputOutput } from '../run-details/flow-step-input-output';

import { TestStepContainer } from '.';

const DRAWER_DEFAULT_HEIGHT_PCT = 65;
const DRAWER_MIN_HEIGHT_PCT = 25;
const DRAWER_MAX_HEIGHT_PCT = 95;
const DRAG_THRESHOLD_PX = 4;

type TestPanelHostProps = {
  mode: 'drawer' | 'split';
  flowId: string;
  flowVersionId: string;
  projectId?: string;
  stepType: FlowActionType | FlowTriggerType;
  showGenerateSampleData: boolean;
  showStepInputOutFromRun: boolean;
  saving: boolean;
};

const TestPanelHost = ({
  mode,
  flowId,
  flowVersionId,
  projectId,
  stepType,
  showGenerateSampleData,
  showStepInputOutFromRun,
  saving,
}: TestPanelHostProps) => {
  const [isTestDrawerOpen, setTestDrawerOpen, run] = useBuilderStateContext(
    (state) => [state.isTestDrawerOpen, state.setTestDrawerOpen, state.run],
  );

  useEffect(() => {
    if (!isNil(run) && mode === 'drawer') {
      setTestDrawerOpen(true);
    }
  }, [run, mode, setTestDrawerOpen]);

  const drawerRef = useRef<HTMLDivElement>(null);
  const dragStateRef = useRef<{
    startY: number;
    startHeightPct: number;
    parentHeightPx: number;
    moved: boolean;
  } | null>(null);
  const [drawerHeightPct, setDrawerHeightPct] = useState(
    DRAWER_DEFAULT_HEIGHT_PCT,
  );

  const body = (
    <>
      {showGenerateSampleData && projectId && (
        <ScrollArea className="h-full">
          <TestStepContainer
            type={stepType}
            flowId={flowId}
            flowVersionId={flowVersionId}
            projectId={projectId}
            isSaving={saving}
          />
        </ScrollArea>
      )}
      {showStepInputOutFromRun && <FlowStepInputOutput />}
    </>
  );

  if (mode === 'split') {
    return (
      <div className="h-full w-full flex flex-col overflow-hidden">{body}</div>
    );
  }

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const parent = drawerRef.current?.parentElement;
    if (!parent) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragStateRef.current = {
      startY: e.clientY,
      startHeightPct: drawerHeightPct,
      parentHeightPx: parent.clientHeight,
      moved: false,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragStateRef.current) return;
    const { startY, startHeightPct, parentHeightPx } = dragStateRef.current;
    const deltaY = e.clientY - startY;
    if (Math.abs(deltaY) > DRAG_THRESHOLD_PX) {
      dragStateRef.current.moved = true;
    }
    if (parentHeightPx === 0) return;
    const deltaPct = (deltaY / parentHeightPx) * 100;
    const next = Math.max(
      DRAWER_MIN_HEIGHT_PCT,
      Math.min(DRAWER_MAX_HEIGHT_PCT, startHeightPct - deltaPct),
    );
    setDrawerHeightPct(next);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.releasePointerCapture(e.pointerId);
    const moved = dragStateRef.current?.moved ?? false;
    dragStateRef.current = null;
    if (!moved) {
      setTestDrawerOpen(false);
    }
  };

  return (
    <div
      ref={drawerRef}
      className={cn(
        'absolute inset-x-0 bottom-0 z-20 bg-background border-t border-border shadow-2xl rounded-t-lg flex flex-col',
        'transition-[transform] duration-300 ease-out',
        isTestDrawerOpen ? 'translate-y-0' : 'translate-y-full',
      )}
      style={{ height: `${drawerHeightPct}%` }}
      role="dialog"
      aria-hidden={!isTestDrawerOpen}
    >
      <div
        role="separator"
        aria-orientation="horizontal"
        tabIndex={0}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="flex items-center justify-center px-3 py-2 shrink-0 hover:bg-muted/50 transition-colors cursor-row-resize touch-none select-none"
      >
        <div className="h-1 w-12 rounded-full bg-muted" />
      </div>
      <div className="flex-1 min-h-0 overflow-hidden">{body}</div>
    </div>
  );
};

TestPanelHost.displayName = 'TestPanelHost';
export { TestPanelHost };
