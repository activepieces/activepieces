import { t } from 'i18next';
import { useRef } from 'react';

import { EditFlowOrViewDraftButton } from '@/app/builder/builder-header/flow-status/view-draft-or-edit-flow-button';
import { useBuilderStateContext } from '@/app/builder/builder-hooks';
import { flowRunUtils } from '@/features/flow-runs/lib/flow-run-utils';
import { flowHooks } from '@/features/flows/lib/flow-hooks';
import { pieceSelectorUtils } from '@/features/pieces/lib/piece-selector-utils';
import { ChatDrawerSource } from '@/lib/types';
import {
  isNil,
  FlowTriggerType,
  UpdateRunProgressRequest,
  assertNotNullOrUndefined,
} from '@activepieces/shared';

import { AboveTriggerButton } from './above-trigger-button';

const TestFlowWidget = () => {
  const [
    setChatDrawerOpenSource,
    flowVersion,
    readonly,
    hideTestWidget,
    run,
    setRun,
  ] = useBuilderStateContext((state) => [
    state.setChatDrawerOpenSource,
    state.flowVersion,
    state.readonly,
    state.hideTestWidget,
    state.run,
    state.setRun,
  ]);
  const runRef = useRef(run);
  runRef.current = run;

  const triggerHasSampleData =
    flowVersion.trigger.type === FlowTriggerType.PIECE &&
    !isNil(flowVersion.trigger.settings.sampleData?.lastTestDate);

  const isChatTrigger = pieceSelectorUtils.isChatTrigger(
    flowVersion.trigger.settings.pieceName,
    flowVersion.trigger.settings.triggerName,
  );

  const { mutate: runFlow, isPending } = flowHooks.useTestFlow({
    flowVersionId: flowVersion.id,
    onUpdateRun: (response: UpdateRunProgressRequest) => {
      assertNotNullOrUndefined(response.flowRun, 'flowRun');
      const steps = runRef.current?.steps ?? {};
      if (!isNil(response.step)) {
        const updatedSteps = flowRunUtils.updateRunSteps(
          steps,
          response.step?.name,
          response.step?.path,
          response.step?.output,
        );
        setRun({ ...response.flowRun, steps: updatedSteps }, flowVersion);
      }
    },
  });

  if (!flowVersion.valid) {
    return null;
  }

  if (hideTestWidget) {
    return null;
  }

  if (isChatTrigger) {
    return (
      <AboveTriggerButton
        onClick={() => {
          setChatDrawerOpenSource(ChatDrawerSource.TEST_FLOW);
        }}
        text={t('Open Chat')}
        loading={isPending}
      />
    );
  }

  if (readonly) {
    return (
      <EditFlowOrViewDraftButton onCanvas={true}></EditFlowOrViewDraftButton>
    );
  }

  return (
    <AboveTriggerButton
      onClick={() => {
        runFlow();
      }}
      text={t('Test Flow')}
      triggerHasNoSampleData={!triggerHasSampleData}
      loading={isPending}
    />
  );
};

TestFlowWidget.displayName = 'TestFlowWidget';

export { TestFlowWidget };
