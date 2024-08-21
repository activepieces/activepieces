import { ViewportPortal } from '@xyflow/react';
import { t } from 'i18next';
import React from 'react';

import { Button } from '@/components/ui/button';

import { useBuilderStateContext } from '../../builder-hooks';
import { TestFlowWidget } from '@/app/builder/flow-canvas/widgets/test-flow-widget';
import IncompleteSettingsButton from '@/app/builder/flow-canvas/widgets/incomplete-settings-widget';
import FlowEndWidget from '@/app/builder/flow-canvas/widgets/flow-end-widget';
import { AP_NODE_SIZE } from '@/app/builder/flow-canvas/flow-canvas-utils';

const AboveFlowWidgets = React.memo(() => {
  const [
    flowVersion,
    setRun,
    selectStepByName,
    clickOnNewNodeButton,
    readonly,
  ] = useBuilderStateContext((state) => [
    state.flowVersion,
    state.setRun,
    state.selectStepByName,
    state.clickOnNewNodeButton,
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
                clickOnNewNodeButton={clickOnNewNodeButton}
                selectStepByName={selectStepByName}
              ></IncompleteSettingsButton>
            </>
          )}
          {readonly && (
            <Button
              variant="ghost"
              className="h-8 bg-muted text-accent-foreground border-none disabled:opacity-100"
              disabled={true}
              key={'view-only-button'}
            >
              {t('View Only')}
            </Button>
          )}
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
