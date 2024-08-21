import { useMutation } from '@tanstack/react-query';
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
import { FlowRun, FlowVersion, isNil, TriggerType } from '@activepieces/shared';

type TestFlowWidgetPorps = {
  flowVersion: FlowVersion;
  setRun: (run: FlowRun, flowVersion: FlowVersion) => void;
};

const TestFlowWidget = ({ flowVersion, setRun }: TestFlowWidgetPorps) => {
  const socket = useSocket();

  const triggerHasSampleData =
    flowVersion.trigger.type === TriggerType.PIECE &&
    !isNil(flowVersion.trigger.settings.inputUiInfo?.currentSelectedData);

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

  return (
    flowVersion.valid && (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            className="h-8 bg-primary-100/80 text-primary-300 hover:bg-primary-100/80 disabled:pointer-events-auto hover:border-primary hover:text-primary-300 border-primary/50 border border-solid rounded-full animate-fade"
            disabled={!triggerHasSampleData}
            loading={isPending}
            onClick={() => mutate()}
          >
            {t('Test Flow')}
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
