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
    publishedVersionId,
  ] = useBuilderStateContext((state) => [
    state.setChatDrawerOpenSource,
    state.flowVersion,
    state.readonly,
    state.hideTestWidget,
    state.setRun,
    state.flow.publishedVersionId,
  ]);

  const triggerHasSampleData =
    flowVersion.trigger.type === FlowTriggerType.PIECE &&
    !isNil(flowVersion.trigger.settings.sampleData?.lastTestDate);

  const isChatTrigger = pieceSelectorUtils.isChatTrigger(
    flowVersion.trigger.settings.pieceName,
    flowVersion.trigger.settings.triggerName,
  );
  const isManualTrigger = pieceSelectorUtils.isManualTrigger(
    flowVersion.trigger.settings.pieceName,
    flowVersion.trigger.settings.triggerName,
  );

  const { mutate: runFlow, isPending: isTestingFlow } = flowHooks.useTestFlow({
    flowVersionId: flowVersion.id,
    onUpdateRun: (run) => {
      setRun(run, flowVersion);
    },
  });
  const { mutate: startManualTrigger, isPending: isStartingManualTrigger } =
    flowHooks.useStartManualTrigger({
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
        if (isManualTrigger) {
          startManualTrigger();
        } else {
          runFlow();
        }
      }}
      text={isManualTrigger ? t('Run Flow') : t('Test Flow')}
      disable={!triggerHasSampleData && !isManualTrigger}
      loading={isTestingFlow || isStartingManualTrigger}
    />
  );
};

TestFlowWidget.displayName = 'TestFlowWidget';

export { TestFlowWidget };
