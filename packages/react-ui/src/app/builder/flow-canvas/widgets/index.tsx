import { useReactFlow, ViewportPortal } from '@xyflow/react';
import React from 'react';

import {
  AP_NODE_SIZE,
  flowCanvasUtils,
} from '@/app/builder/flow-canvas/flow-canvas-utils';
import FlowEndWidget from '@/app/builder/flow-canvas/widgets/flow-end-widget';
import IncompleteSettingsButton from '@/app/builder/flow-canvas/widgets/incomplete-settings-widget';
import { TestFlowWidget } from '@/app/builder/flow-canvas/widgets/test-flow-widget';
import ViewOnlyWidget from '@/app/builder/flow-canvas/widgets/view-only-widget';

import { flowRunUtils } from '../../../../features/flow-runs/lib/flow-run-utils';
import { useBuilderStateContext } from '../../builder-hooks';

const AboveFlowWidgets = React.memo(() => {
  const [flowVersion, setRun, selectStepByName, readonly] =
    useBuilderStateContext((state) => [
      state.flowVersion,
      state.setRun,
      state.selectStepByName,
      state.readonly,
    ]);
  const { fitView } = useReactFlow();
  return (
    <ViewportPortal>
      <div
        style={{
          transform: `translate(0px,-${AP_NODE_SIZE.stepNode.height / 2 + 8
            }px )`,
          position: 'absolute',
          pointerEvents: 'auto',
        }}
      >
        <div className="justify-center items-center flex w-[260px]">
          {!readonly && (
            <>
              <TestFlowWidget
                flowVersion={flowVersion}
                setRun={(run, flowVersion) => {
                  setRun(run, flowVersion);
                  const failedStep = run.steps
                    ? flowRunUtils.findFailedStep(run)
                    : null;
                  if (failedStep) {
                    fitView(
                      flowCanvasUtils.createFocusStepInGraphParams(
                        failedStep,
                      ),
                    );
                  }
                }}
              ></TestFlowWidget>
              <IncompleteSettingsButton
                flowVersion={flowVersion}
                selectStepByName={selectStepByName}
              ></IncompleteSettingsButton>
            </>
          )}
          {readonly && <ViewOnlyWidget></ViewOnlyWidget>}
        </div>
      </div>
    </ViewportPortal>
  );
});
AboveFlowWidgets.displayName = 'AboveFlowWidgets';
const BelowFlowWidget = React.memo(
  ({ graphHeight }: { graphHeight: number }) => {
    return (
      <ViewportPortal>
        <div
          style={{
            transform: `translate(0px, ${graphHeight + 18}px)`,
            position: 'absolute',
            pointerEvents: 'auto',
          }}
        >
          <div
            className="flex items-center justify-center gap-2"
            style={{ width: AP_NODE_SIZE.stepNode.width + 'px' }}
          >
            <FlowEndWidget></FlowEndWidget>
          </div>
        </div>
      </ViewportPortal>
    );
  },
);

BelowFlowWidget.displayName = 'BelowFlowWidget';
export { AboveFlowWidgets, BelowFlowWidget };
