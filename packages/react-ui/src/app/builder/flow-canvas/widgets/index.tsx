import { ViewportPortal } from '@xyflow/react';
import React from 'react';

import FlowEndWidget from '@/app/builder/flow-canvas/widgets/flow-end-widget';
import IncompleteSettingsButton from '@/app/builder/flow-canvas/widgets/incomplete-settings-widget';
import { TestFlowWidget } from '@/app/builder/flow-canvas/widgets/test-flow-widget';

import { useBuilderStateContext } from '../../builder-hooks';
import { flowUtilConsts } from '../utils/consts';

const AboveFlowWidgets = React.memo(() => {
  const [flowVersion, selectStepByName, readonly] = useBuilderStateContext(
    (state) => [state.flowVersion, state.selectStepByName, state.readonly],
  );
  return (
    <ViewportPortal>
      <div
        style={{
          position: 'absolute',
          pointerEvents: 'auto',
          top: `-${flowUtilConsts.AP_NODE_SIZE.STEP.height / 2 + 8}px`,
          left: `-99px`,
        }}
      >
        <div className="flex items-center justify-center w-[260px]">
          <TestFlowWidget></TestFlowWidget>
          {!readonly && (
            <IncompleteSettingsButton
              flowVersion={flowVersion}
              selectStepByName={selectStepByName}
            ></IncompleteSettingsButton>
          )}
        </div>
      </div>
    </ViewportPortal>
  );
});
AboveFlowWidgets.displayName = 'AboveFlowWidgets';
const BelowFlowWidget = React.memo(() => {
  return (
    <ViewportPortal>
      <div
        style={{
          pointerEvents: 'auto',
        }}
      >
        <div
          className="flex items-center justify-center gap-2"
          style={{ width: flowUtilConsts.AP_NODE_SIZE.STEP.width + 'px' }}
        >
          <FlowEndWidget></FlowEndWidget>
        </div>
      </div>
    </ViewportPortal>
  );
});

BelowFlowWidget.displayName = 'BelowFlowWidget';
export { AboveFlowWidgets, BelowFlowWidget };
