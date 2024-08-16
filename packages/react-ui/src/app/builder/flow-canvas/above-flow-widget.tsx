import { useMutation } from '@tanstack/react-query';
import { ViewportPortal } from '@xyflow/react';
import React from 'react';
import { t } from 'i18next';
import { useSocket } from '@/components/socket-provider';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { INTERNAL_ERROR_TOAST, toast } from '@/components/ui/use-toast';
import { flowsApi } from '@/features/flows/lib/flows-api';
import {
  StepLocationRelativeToParent,
  TriggerType,
  flowHelper,
  isNil,
} from '@activepieces/shared';

import { useBuilderStateContext } from '../builder-hooks';

const AboveFlowWidget = React.memo(() => {
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

  const triggerHasSampleData =
    flowVersion.trigger.type === TriggerType.PIECE &&
    !isNil(flowVersion.trigger.settings.inputUiInfo?.currentSelectedData);

  const socket = useSocket();
  const { mutate, isPending } = useMutation<void>({
    mutationFn: () =>
      flowsApi.testFlow(
        socket,
        {
          flowVersionId: flowVersion.id,
        },
        (run) => {
          setRun(run, flowVersion);
        },
      ),
    onSuccess: () => {},
    onError: (error) => {
      console.log(error);
      toast(INTERNAL_ERROR_TOAST);
    },
  });

  function handleCompleteSettings() {
    const invalidSteps = flowHelper
      .getAllSteps(flowVersion.trigger)
      .filter((step) => !step.valid);
    if (invalidSteps.length > 0) {
      if (invalidSteps[0].type === TriggerType.EMPTY) {
        clickOnNewNodeButton(
          'trigger',
          invalidSteps[0].name,
          StepLocationRelativeToParent.AFTER,
        );
      } else {
        selectStepByName(invalidSteps[0].name);
      }
      return;
    }
  }

  return (
    <ViewportPortal>
      <div
        style={{
          transform: 'translate(0px, -50px)',
          position: 'absolute',
          pointerEvents: 'auto',
        }}
      >
        <div className="justify-center items-center flex w-[260px]">
          {!readonly && (
            <>
              {flowVersion.valid && triggerHasSampleData && (
                <Button
                  key={'test-flow-button'}
                  variant="outline"
                  className="h-8 bg-primary-100/50 text-primary-300 hover:bg-primary-100/80 hover:text-primary-300 border-none"
                  loading={isPending}
                  onClick={() => mutate()}
                >
                  {t('Test Flow')}
                </Button>
              )}
              {flowVersion.valid && !triggerHasSampleData && (
                <Tooltip>
                  <TooltipTrigger
                    asChild
                    className="disabled:pointer-events-auto"
                  >
                    <Button
                      variant="ghost"
                      className="h-8 bg-primary-100/80 text-primary-300 hover:bg-primary-100/80 hover:text-primary-300 border-none"
                      disabled={true}
                    >
                      {t('Test Flow')}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    {t('Please test the trigger first')}
                  </TooltipContent>
                </Tooltip>
              )}
              {!flowVersion.valid && (
                <Button
                  variant="ghost"
                  className="h-8 bg-warning-100/50 text-warning-300 hover:bg-warning-100/80 hover:text-warning-300 border-none"
                  key={'complete-flow-button'}
                  onClick={handleCompleteSettings}
                >
                  {t('Complete Settings')}
                </Button>
              )}
            </>
          )}
          {readonly && (
            <Button
              variant="ghost"
              className="h-8 bg-muted text-accent-foreground border-none disabled:opacity-100"
              disabled={true}
              key={'complete-flow-button'}
              onClick={handleCompleteSettings}
            >
              {t('View Only')}
            </Button>
          )}
        </div>
      </div>
    </ViewportPortal>
  );
});

AboveFlowWidget.displayName = 'TestFlowWidget';
export { AboveFlowWidget as TestFlowWidget };