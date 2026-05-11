import { FlowActionType, FlowTriggerType } from '@activepieces/shared';
import { GripHorizontalIcon } from 'lucide-react';
import { useRef, useState } from 'react';

import { useBuilderStateContext } from '@/app/builder/builder-hooks';
import { ScrollArea } from '@/components/ui/scroll-area';

import { FlowStepInputOutput } from '../run-details/flow-step-input-output';

import { TestStepContainer } from '.';

const DRAWER_DEFAULT_HEIGHT_PCT = 33;
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
  const setTestPanelOpen = useBuilderStateContext(
    (state) => state.setTestPanelOpen,
  );
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
      setTestPanelOpen(false);
    }
  };

  const handlePointerCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.releasePointerCapture(e.pointerId);
    dragStateRef.current = null;
  };

  const drawerHeightPctRounded = Math.round(drawerHeightPct);

  return (
    <div
      ref={drawerRef}
      className="bg-background border-t shadow-2xl flex flex-col shrink-0"
      style={{ height: `${drawerHeightPct}%` }}
      role="dialog"
    >
      <div
        role="separator"
        aria-orientation="horizontal"
        aria-valuemin={DRAWER_MIN_HEIGHT_PCT}
        aria-valuemax={DRAWER_MAX_HEIGHT_PCT}
        aria-valuenow={drawerHeightPctRounded}
        tabIndex={0}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        className="relative flex h-3 w-full items-center justify-center shrink-0 cursor-row-resize touch-none select-none outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1"
      >
        <div className="flex h-3 w-4 items-center -translate-y-1 justify-center rounded-xs border bg-border">
          <GripHorizontalIcon className="size-2.5  hover:fill-primary" />
        </div>
      </div>
      <div className="flex-1 min-h-0 overflow-hidden">{body}</div>
    </div>
  );
};

TestPanelHost.displayName = 'TestPanelHost';
export { TestPanelHost };
