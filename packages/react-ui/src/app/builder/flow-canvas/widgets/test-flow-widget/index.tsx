import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';

import {
  ChatDrawerSource,
  useBuilderStateContext,
} from '@/app/builder/builder-hooks';
import { useSocket } from '@/components/socket-provider';
import { flowRunsApi } from '@/features/flow-runs/lib/flow-runs-api';
import { pieceSelectorUtils } from '@/features/pieces/lib/piece-selector-utils';
import { isNil, TriggerType } from '@activepieces/shared';

import ViewOnlyWidget from '../view-only-widget';

import { TestButton } from './test-button';

const TestFlowWidget = () => {
  const socket = useSocket();
  const [setChatDrawerOpenSource, flowVersion, readonly, setRun] =
    useBuilderStateContext((state) => [
      state.setChatDrawerOpenSource,
      state.flowVersion,
      state.readonly,
      state.setRun,
    ]);

  const triggerHasSampleData =
    flowVersion.trigger.type === TriggerType.PIECE &&
    !isNil(flowVersion.trigger.settings.inputUiInfo?.lastTestDate);

  const isChatTrigger = pieceSelectorUtils.isChatTrigger(
    flowVersion.trigger.settings.pieceName,
    flowVersion.trigger.settings.triggerName,
  );

  const { mutate: runFlow, isPending } = useMutation<void>({
    mutationFn: () =>
      flowRunsApi.testFlow(
        socket,
        {
          flowVersionId: flowVersion.id,
        },
        (run) => {
          setRun(run, flowVersion);
        },
      ),
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
        disabled={!triggerHasSampleData}
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
