import { FlowActionType, FlowTriggerType, isNil } from '@activepieces/shared';
import { useCallback, useRef, useSyncExternalStore } from 'react';

import { useBuilderStateContext } from '@/app/builder/builder-hooks';
import { cn } from '@/lib/utils';

import { flowCanvasConsts } from '../flow-canvas/utils/consts';
import { FlowStepInputOutput } from '../run-details/flow-step-input-output';
import { TestStepContainer } from '../test-step';

const DISMISS_IGNORE_SELECTOR = [
  '[data-test-panel-trigger]',
  '[data-radix-popper-content-wrapper]',
  '[role="dialog"]',
  '[data-slot="resizable-handle"]',
  '[data-panel-resize-handle-id]',
].join(',');

type StepDataPanelHostProps = {
  mode: 'drawer' | 'split';
  flowId: string;
  flowVersionId: string;
  projectId?: string;
  stepType: FlowActionType | FlowTriggerType;
  showGenerateSampleData: boolean;
  showStepInputOutFromRun: boolean;
  saving: boolean;
};

const StepDataPanelHost = ({
  mode,
  flowId,
  flowVersionId,
  projectId,
  stepType,
  showGenerateSampleData,
  showStepInputOutFromRun,
  saving,
}: StepDataPanelHostProps) => {
  const [setStepDataPanelOpen, isStepDataPanelOpen, run] =
    useBuilderStateContext((state) => [
      state.setStepDataPanelOpen,
      state.isStepDataPanelOpen,
      state.run,
    ]);
  const drawerRef = useRef<HTMLDivElement>(null);

  const subscribeToOutsideDismiss = useCallback(
    (notify: () => void) => {
      if (mode !== 'drawer' || !isStepDataPanelOpen) return () => {};
      const handlePointerDown = (event: PointerEvent) => {
        const target = event.target;
        if (!(target instanceof Element)) return;
        if (drawerRef.current?.contains(target)) return;
        if (target.closest(DISMISS_IGNORE_SELECTOR)) return;
        if (
          target.closest(
            `[data-${flowCanvasConsts.STEP_CONTEXT_MENU_ATTRIBUTE}]`,
          ) &&
          !isNil(run)
        )
          return;
        setStepDataPanelOpen(false);
        notify();
      };
      document.addEventListener('pointerdown', handlePointerDown);
      return () =>
        document.removeEventListener('pointerdown', handlePointerDown);
    },
    [mode, isStepDataPanelOpen, setStepDataPanelOpen, run],
  );

  useSyncExternalStore(subscribeToOutsideDismiss, () => isStepDataPanelOpen);

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

StepDataPanelHost.displayName = 'StepDataPanelHost';
export { StepDataPanelHost };
