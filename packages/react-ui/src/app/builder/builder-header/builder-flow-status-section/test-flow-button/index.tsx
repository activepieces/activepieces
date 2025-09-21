import { t } from 'i18next';

import {
  ChatDrawerSource,
  useBuilderStateContext,
} from '@/app/builder/builder-hooks';
import { flowsHooks } from '@/features/flows/lib/flows-hooks';
import { pieceSelectorUtils } from '@/features/pieces/lib/piece-selector-utils';
import { isNil, FlowTriggerType } from '@activepieces/shared';

import ViewOnlyWidget from '../../../flow-canvas/widgets/view-only-widget';

import { TestButtonWithTooltip } from './test-button-with-tooltip';

const TestFlowButton = () => {
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
      <TestButtonWithTooltip
        onClick={() => {
          setChatDrawerOpenSource(ChatDrawerSource.TEST_FLOW);
        }}
        text={t('Open Chat')}
        loading={isPending}
        showKeyboardShortcut={false}
      />
    );
  }

  if (readonly) {
    return <ViewOnlyWidget />;
  }

  return (
    <TestButtonWithTooltip
      onClick={() => {
        runFlow();
      }}
      text={t('Test Flow')}
      disabled={!triggerHasSampleData}
      loading={isPending}
      showKeyboardShortcut={false}
    />
  );
};

TestFlowButton.displayName = 'TestFlowButton';

export { TestFlowButton };
