import { ViewportPortal } from '@xyflow/react';
import React from 'react';

import FlowEndWidget from '@/app/builder/flow-canvas/widgets/flow-end-widget';
import { flagsHooks } from '@/hooks/flags-hooks';
import { ApEdition, ApFlagId } from '@activepieces/shared';

import { flowUtilConsts } from '../utils/consts';

import { FlowContextWidget } from './flow-context-widget';
import { useBuilderStateContext } from '../../builder-hooks';

const AboveFlowWidgets = React.memo(() => {
  const { data: flags } = flagsHooks.useFlags();
  const { flowVersion } = useBuilderStateContext((state) => ({
    flowVersion: state.flowVersion,
  }));
  return (
    <ViewportPortal>
      <div
        style={{
          transform: `translate(0px,-${
            flowUtilConsts.AP_NODE_SIZE.STEP.height / 2 + 8
          }px )`,
          position: 'absolute',
          pointerEvents: 'auto',
        }}
      >
        <div className="justify-center items-center flex w-[260px] relative">
          {flags?.[ApFlagId.EDITION] !== ApEdition.COMMUNITY && (
            <FlowContextWidget key={flowVersion.id}></FlowContextWidget>
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
