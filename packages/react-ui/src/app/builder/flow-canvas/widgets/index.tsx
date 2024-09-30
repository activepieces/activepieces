import { ViewportPortal } from '@xyflow/react';
import React from 'react';

import { AP_NODE_SIZE } from '@/app/builder/flow-canvas/flow-canvas-utils';
import FlowEndWidget from '@/app/builder/flow-canvas/widgets/flow-end-widget';
import IncompleteSettingsButton from '@/app/builder/flow-canvas/widgets/incomplete-settings-widget';
import { TestFlowWidget } from '@/app/builder/flow-canvas/widgets/test-flow-widget';
import ViewOnlyWidget from '@/app/builder/flow-canvas/widgets/view-only-widget';

import { useBuilderStateContext } from '../../builder-hooks';

const AboveFlowWidgets = React.memo(() => {
  const [flowVersion, setRun, selectStepByName, readonly] =
    useBuilderStateContext((state) => [
      state.flowVersion,
      state.setRun,
      state.selectStepByName,
      state.readonly,
    ]);
  return (
    <ViewportPortal>
      <div
        style={{
          transform: `translate(0px,-${
            AP_NODE_SIZE.stepNode.height / 2 + 8
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
                setRun={setRun}
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
