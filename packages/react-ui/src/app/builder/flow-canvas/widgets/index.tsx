import { ViewportPortal } from '@xyflow/react';
import React from 'react';

import { shallow } from 'zustand/shallow';

import FlowEndWidget from '@/app/builder/flow-canvas/widgets/flow-end-widget';
import IncompleteSettingsButton, {
  filterValidOrSkippedSteps,
} from '@/app/builder/flow-canvas/widgets/incomplete-settings-widget';
import { TestFlowWidget } from '@/app/builder/flow-canvas/widgets/test-flow-widget';
import { flowStructureUtil } from '@activepieces/shared';

import { useBuilderStateContext } from '../../builder-hooks';
import { flowUtilConsts } from '../utils/consts';

const AboveFlowWidgets = React.memo(() => {
  const [
    invalidStepsCount,
    firstInvalidStepName,
    isValid,
    selectStepByName,
    readonly,
  ] = useBuilderStateContext(
    (state) => {
      const steps = flowStructureUtil.getAllSteps(state.flowVersion.trigger);
      const invalidSteps = steps.filter(filterValidOrSkippedSteps);
      return [
        invalidSteps.length,
        invalidSteps[0]?.name,
        state.flowVersion.valid,
        state.selectStepByName,
        state.readonly,
      ];
    },
    shallow,
  );
  return (
    <ViewportPortal>
      <WidgetWrapper>
        <div
          style={{
            transform: `translate(0px,-${flowUtilConsts.AP_NODE_SIZE.STEP.height}px )`,
            position: 'absolute',
            pointerEvents: 'auto',
          }}
        >
          <div className="justify-center items-center flex w-[260px]">
            <TestFlowWidget></TestFlowWidget>
            {!readonly && (
              <IncompleteSettingsButton
                isValid={isValid}
                invalidStepsCount={invalidStepsCount}
                firstInvalidStepName={firstInvalidStepName}
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
            style={{ width: flowUtilConsts.AP_NODE_SIZE.STEP.width + 'px' }}
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
      style={{ width: flowUtilConsts.AP_NODE_SIZE.STEP.width + 'px' }}
      className="flex items-center justify-center"
    >
      {children}
    </div>
  );
};

BelowFlowWidget.displayName = 'BelowFlowWidget';
export { AboveFlowWidgets, BelowFlowWidget };
