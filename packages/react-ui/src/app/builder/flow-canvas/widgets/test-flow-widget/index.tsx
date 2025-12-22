import { useContext } from 'react';
import { shallow } from 'zustand/shallow';
import { t } from 'i18next';
import {
  BuilderState,
  BuilderStateContext,
  ChatDrawerSource,
  useBuilderStateContext,
} from '@/app/builder/builder-hooks';
import { flowHooks } from '@/features/flows/lib/flow-hooks';
import { pieceSelectorUtils } from '@/features/pieces/lib/piece-selector-utils';
import { isNil, FlowTriggerType } from '@activepieces/shared';
import ViewOnlyWidget from '../view-only-widget';
import { TestButton } from './test-button';

const TestFlowWidget = () => {
  const store = useContext(BuilderStateContext);
  if (!store) {
    throw new Error('Missing BuilderStateContext.Provider in the tree');
  }
  const [
    setChatDrawerOpenSource,
    readonly,
    flowVersionId,
    isValid,
    triggerType,
    sampleDataLastTestDate,
    pieceName,
    triggerName,
  ] = useBuilderStateContext(
    (state: BuilderState) => [
      state.setChatDrawerOpenSource,
      state.readonly,
      state.flowVersion.id,
      state.flowVersion.valid,
      state.flowVersion.trigger.type,
      state.flowVersion.trigger.settings.sampleData?.lastTestDate,
      (state.flowVersion.trigger.settings as any).pieceName,
      (state.flowVersion.trigger.settings as any).triggerName,
    ],
    shallow,
  );

  const triggerHasSampleData =
    triggerType === FlowTriggerType.PIECE && !isNil(sampleDataLastTestDate);

  const isChatTrigger = pieceSelectorUtils.isChatTrigger(
    pieceName,
    triggerName,
  );

  const { mutate: runFlow, isPending } = flowHooks.useTestFlow({
    flowVersionId,
    onUpdateRun: (run) => {
      const state = store.getState();
      state.setRun(run, state.flowVersion);
    },
  });

  if (!isValid) {
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
      triggerHasNoSampleData={!triggerHasSampleData}
      loading={isPending}
    />
  );
};

TestFlowWidget.displayName = 'TestFlowWidget';

export { TestFlowWidget };
