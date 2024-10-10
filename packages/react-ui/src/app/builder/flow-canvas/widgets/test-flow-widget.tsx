import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { useEffect } from 'react';

import { useSocket } from '@/components/socket-provider';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { INTERNAL_ERROR_TOAST, toast } from '@/components/ui/use-toast';
import { FlowRun, FlowVersion, isNil, TriggerType } from '@activepieces/shared';

import { flowRunsApi } from '../../../../features/flow-runs/lib/flow-runs-api';

type TestFlowWidgetProps = {
  flowVersion: FlowVersion;
  setRun: (run: FlowRun, flowVersion: FlowVersion) => void;
};

const TestFlowWidget = ({ flowVersion, setRun }: TestFlowWidgetProps) => {
  const socket = useSocket();

  const isMac = /(Mac)/i.test(navigator.userAgent);

  const triggerHasSampleData =
    flowVersion.trigger.type === TriggerType.PIECE &&
    !isNil(flowVersion.trigger.settings.inputUiInfo?.lastTestDate);

  const { mutate, isPending } = useMutation<void>({
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
    onError: (error) => {
      console.log(error);
      toast(INTERNAL_ERROR_TOAST);
    },
  });

  useEffect(() => {
    const keydownHandler = (event: KeyboardEvent) => {
      if (
        (isMac && event.metaKey && event.key.toLocaleLowerCase() === 'd') ||
        (!isMac && event.ctrlKey && event.key.toLocaleLowerCase() === 'd')
      ) {
        event.preventDefault();
        event.stopPropagation();

        if (!isPending && triggerHasSampleData) {
          mutate();
        }
      }
    };

    window.addEventListener('keydown', keydownHandler, { capture: true });

    return () => {
      window.removeEventListener('keydown', keydownHandler, { capture: true });
    };
  }, [isMac, isPending, triggerHasSampleData, mutate]);

  return (
    flowVersion.valid && (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            className="h-8 !bg-primary-100/80 text-primary-300 disabled:pointer-events-auto hover:!border-primary hover:!text-primary-300 border-primary/50 border border-solid rounded-full animate-fade"
            disabled={!triggerHasSampleData}
            loading={isPending}
            onClick={() => mutate()}
          >
            <div className="flex justify-center items-center gap-2">
              {t('Test Flow')}
              <span className="text-[10px] tracking-widest whitespace-nowrap">
                {isMac ? '⌘ + D' : 'Ctrl + D'}
              </span>
            </div>
          </Button>
        </TooltipTrigger>
        {!triggerHasSampleData && (
          <TooltipContent side="bottom">
            {t('Please test the trigger first')}
          </TooltipContent>
        )}
      </Tooltip>
    )
  );
};

TestFlowWidget.displayName = 'TestFlowWidget';

export { TestFlowWidget };
