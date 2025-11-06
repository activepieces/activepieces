import { t } from 'i18next';

import {
  ChatDrawerSource,
  useBuilderStateContext,
} from '@/app/builder/builder-hooks';
import { flowsHooks } from '@/features/flows/lib/flows-hooks';
import { pieceSelectorUtils } from '@/features/pieces/lib/piece-selector-utils';
import { isNil, FlowTriggerType } from '@activepieces/shared';

import ViewOnlyWidget from '../view-only-widget';

import { TestButton } from './test-button';

const TestFlowWidget = () => {
  const [setChatDrawerOpenSource, flowVersion, readonly, setRun] =
    useBuilderStateContext((state) => [
      state.setChatDrawerOpenSource,
      state.flowVersion,
      state.readonly,
      state.setRun,
    ]);

  const triggerHasSampleData =
    flowVersion.trigger.type === FlowTriggerType.PIECE &&
    !isNil(flowVersion.trigger.settings.sampleData?.lastTestDate);

  const isChatTrigger = pieceSelectorUtils.isChatTrigger(
    flowVersion.trigger.settings.pieceName,
    flowVersion.trigger.settings.triggerName,
  );

  const { mutate: runFlow, isPending } = flowsHooks.useTestFlow({
    flowVersionId: flowVersion.id,
    onUpdateRun: (run) => {
      setRun(run, flowVersion);
    },
  });

  if (!flowVersion.valid) {
    return null;
  }

  if (isChatTrigger) {
    return (
      <TestButton
        onClick={() => {
          setChatDrawerOpenSource(ChatDrawerSource.TEST_FLOW);
        }}
        text={t('Open Chat')}
        loading={isPending}
      />
    );
  }

  if (readonly) {
    return <ViewOnlyWidget />;
  }

  return (
    <TestButton
      onClick={() => {
        runFlow();
      }}
      text={t('Test Flow')}
      disabled={!triggerHasSampleData}
      loading={isPending}
    />
  );
};

TestFlowWidget.displayName = 'TestFlowWidget';

export { TestFlowWidget };
