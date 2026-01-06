import { t } from 'i18next';

import { EditFlowOrViewDraftButton } from '@/app/builder/builder-header/flow-status/view-draft-or-edit-flow-button';
import { useBuilderStateContext } from '@/app/builder/builder-hooks';
import { flowHooks } from '@/features/flows/lib/flow-hooks';
import { pieceSelectorUtils } from '@/features/pieces/lib/piece-selector-utils';
import { ChatDrawerSource } from '@/lib/types';
import { isNil, FlowTriggerType } from '@activepieces/shared';

import { AboveTriggerButton } from './above-trigger-button';

const TestFlowWidget = () => {
  const [
    setChatDrawerOpenSource,
    flowVersion,
    readonly,
    hideTestWidget,
    setRun,
  ] = useBuilderStateContext((state) => [
    state.setChatDrawerOpenSource,
    state.flowVersion,
    state.readonly,
    state.hideTestWidget,
    state.setRun,
  ]);

  const triggerHasSampleData =
    flowVersion.trigger.type === FlowTriggerType.PIECE &&
    !isNil(flowVersion.trigger.settings.sampleData?.lastTestDate);

  const isChatTrigger = pieceSelectorUtils.isChatTrigger(
    flowVersion.trigger.settings.pieceName,
    flowVersion.trigger.settings.triggerName,
  );

  const { mutate: runFlow, isPending } = flowHooks.useTestFlow({
    flowVersionId: flowVersion.id,
    onUpdateRun: (run) => {
      setRun(run, flowVersion);
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
