import { ViewportPortal } from '@xyflow/react';
import React from 'react';

import FlowEndWidget from '@/app/builder/flow-canvas/widgets/flow-end-widget';
import IncompleteSettingsButton from '@/app/builder/flow-canvas/widgets/incomplete-settings-widget';
import { TestFlowWidget } from '@/app/builder/flow-canvas/widgets/test-flow-widget';

import { useBuilderStateContext } from '../../builder-hooks';
import { flowCanvasConsts } from '../utils/consts';

const AboveFlowWidgets = React.memo(() => {
  const [flowVersion, selectStepByName, readonly] = useBuilderStateContext(
    (state) => [state.flowVersion, state.selectStepByName, state.readonly],
  );
  return (
    <ViewportPortal>
      <WidgetWrapper>
        <div
          style={{
            transform: `translate(0px,-${flowCanvasConsts.AP_NODE_SIZE.STEP.height}px )`,
            position: 'absolute',
            pointerEvents: 'auto',
          }}
        >
          <div className="justify-center items-center flex w-[260px]">
            <TestFlowWidget></TestFlowWidget>
            {!readonly && (
              <IncompleteSettingsButton
                flowVersion={flowVersion}
                selectStepByName={selectStepByName}
              ></IncompleteSettingsButton>
            )}
          </div>
        </div>
      </WidgetWrapper>
    </ViewportPortal>
  );
});
AboveFlowWidgets.displayName = 'AboveFlowWidgets';
const BelowFlowWidget = React.memo(() => {
  return (
    <ViewportPortal>
      <WidgetWrapper>
        <div
          style={{
            pointerEvents: 'auto',
          }}
        >
          <div
            className="flex items-center justify-center gap-2"
            style={{ width: flowCanvasConsts.AP_NODE_SIZE.STEP.width + 'px' }}
          >
            <FlowEndWidget></FlowEndWidget>
          </div>
        </div>
      </WidgetWrapper>
    </ViewportPortal>
  );
});

const WidgetWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <div
      style={{ width: flowCanvasConsts.AP_NODE_SIZE.STEP.width + 'px' }}
      className="flex items-center justify-center"
    >
      {children}
    </div>
  );
};

BelowFlowWidget.displayName = 'BelowFlowWidget';
export { AboveFlowWidgets, BelowFlowWidget };
