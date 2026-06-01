import { FlowActionType, FlowTriggerType } from '@activepieces/shared';
import { useEffect, useRef } from 'react';

import { useBuilderStateContext } from '@/app/builder/builder-hooks';
import { cn } from '@/lib/utils';

import { flowCanvasConsts } from '../flow-canvas/utils/consts';
import { FlowStepInputOutput } from '../run-details/flow-step-input-output';

import { TestStepContainer } from '.';

const DISMISS_IGNORE_SELECTOR = [
  '[data-test-panel-trigger]',
  '[data-radix-popper-content-wrapper]',
  '[role="dialog"]',
  '[data-slot="resizable-handle"]',
  '[data-panel-resize-handle-id]',
].join(',');

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
  const [setTestPanelOpen, isTestPanelOpen] = useBuilderStateContext(
    (state) => [state.setTestPanelOpen, state.isTestPanelOpen],
  );
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (mode !== 'drawer' || !isTestPanelOpen) return;
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (drawerRef.current?.contains(target)) return;
      if (target.closest(DISMISS_IGNORE_SELECTOR)) return;
      if (
        target.closest(`[data-${flowCanvasConsts.STEP_CONTEXT_MENU_ATTRIBUTE}]`)
      )
        return;
      setTestPanelOpen(false);
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [mode, isTestPanelOpen, setTestPanelOpen]);

  return (
    <div
      ref={drawerRef}
      className={cn(
        'h-full w-full bg-background flex flex-col overflow-hidden border border-border',
        mode === 'drawer' && 'rounded-t-xl shadow-lg border-b-0 border-x-0',
        mode === 'split' && 'rounded-t-xl border-b-0',
      )}
      role={mode === 'drawer' ? 'dialog' : undefined}
    >
      {showGenerateSampleData && projectId && (
        <TestStepContainer
          type={stepType}
          flowId={flowId}
          flowVersionId={flowVersionId}
          projectId={projectId}
          isSaving={saving}
        />
      )}
      {showStepInputOutFromRun && <FlowStepInputOutput />}
    </div>
  );
};

TestPanelHost.displayName = 'TestPanelHost';
export { TestPanelHost };
