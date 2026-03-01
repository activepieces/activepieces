import {
  isNil,
  FlowTriggerKind,
  UpdateRunProgressRequest,
  assertNotNullOrUndefined,
  flowStructureUtil,
} from '@activepieces/shared';
import { t } from 'i18next';
import { useRef } from 'react';

import { EditFlowOrViewDraftButton } from '@/app/builder/builder-header/flow-status/view-draft-or-edit-flow-button';
import { useBuilderStateContext } from '@/app/builder/builder-hooks';
import { flowRunUtils } from '@/features/flow-runs/lib/flow-run-utils';
import { flowHooks } from '@/features/flows/lib/flow-hooks';
import { pieceSelectorUtils } from '@/features/pieces/lib/piece-selector-utils';
import { ChatDrawerSource } from '@/lib/types';

import { AboveTriggerButton } from './above-trigger-button';

const TestFlowWidget = () => {
  const [
    setChatDrawerOpenSource,
    flowVersion,
    readonly,
    hideTestWidget,
    run,
    setRun,
    publishedVersionId,
  ] = useBuilderStateContext((state) => [
    state.setChatDrawerOpenSource,
    state.flowVersion,
    state.readonly,
    state.hideTestWidget,
    state.run,
    state.setRun,
    state.flow.publishedVersionId,
  ]);
  const runRef = useRef(run);
  runRef.current = run;

  const triggerNode = flowStructureUtil.getTriggerNode(flowVersion.graph);
  const triggerData = triggerNode?.data;
  const triggerHasSampleData =
    triggerData?.kind === FlowTriggerKind.PIECE &&
    !isNil(triggerData.settings.sampleData?.lastTestDate);

  const isChatTrigger =
    triggerData?.kind === FlowTriggerKind.PIECE &&
    pieceSelectorUtils.isChatTrigger(
      triggerData.settings.pieceName,
      triggerData.settings.triggerName ?? '',
    );
  const isManualTrigger =
    triggerData?.kind === FlowTriggerKind.PIECE &&
    pieceSelectorUtils.isManualTrigger({
      pieceName: triggerData.settings.pieceName,
      triggerName: triggerData.settings.triggerName ?? '',
    });

  const { mutate: runFlow, isPending: isTestingFlow } =
    flowHooks.useTestFlowOrStartManualTrigger({
      flowVersionId: flowVersion.id,
      isForManualTrigger: isManualTrigger,
      onUpdateRun: (response: UpdateRunProgressRequest) => {
        assertNotNullOrUndefined(response.flowRun, 'flowRun');
        const steps = runRef.current?.steps ?? {};
        const startTime =
          response.flowRun.startTime ?? runRef.current?.startTime;
        if (!isNil(response.step)) {
          const updatedSteps = flowRunUtils.updateRunSteps(
            steps,
            response.step?.name,
            response.step?.path,
            response.step?.output,
          );
          setRun(
            { ...response.flowRun, startTime, steps: updatedSteps },
            flowVersion,
          );
        }
        setRun({ ...response.flowRun, startTime, steps }, flowVersion);
      },
    });

  if (!flowVersion.valid) {
    return null;
  }

  if (hideTestWidget) {
    return null;
  }
  if (
    isManualTrigger &&
    (publishedVersionId !== flowVersion.id || isNil(publishedVersionId))
  ) {
    return null;
  }

  if (readonly) {
    return (
      <EditFlowOrViewDraftButton onCanvas={true}></EditFlowOrViewDraftButton>
    );
  }

  if (isChatTrigger) {
    return (
      <AboveTriggerButton
        onClick={() => {
          setChatDrawerOpenSource(ChatDrawerSource.TEST_FLOW);
        }}
        text={t('Open Chat')}
        loading={isTestingFlow}
      />
    );
  }

  return (
    <AboveTriggerButton
      onClick={() => {
        runFlow();
      }}
      text={isManualTrigger ? t('Run Flow') : t('Test Flow')}
      disable={!triggerHasSampleData && !isManualTrigger}
      loading={isTestingFlow}
    />
  );
};

TestFlowWidget.displayName = 'TestFlowWidget';

export { TestFlowWidget };
