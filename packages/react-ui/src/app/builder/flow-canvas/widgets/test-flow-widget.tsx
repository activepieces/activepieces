import { flowsApi } from '@/features/flows/lib/flows-api';
import { useMutation } from '@tanstack/react-query';
import {
  FlowRun,
  FlowVersion,
  isNil,
  TriggerType,
} from '../../../../../../shared/src';
import { useSocket } from '@/components/socket-provider';
import { INTERNAL_ERROR_TOAST, toast } from '@/components/ui/use-toast';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { t } from 'i18next';

type TestFlowWidgetPorps = {
  flowVersion: FlowVersion;
  setRun: (run: FlowRun, flowVersion: FlowVersion) => void;
};
export const TestFlowWidget: React.FC<TestFlowWidgetPorps> = ({
  flowVersion,
  setRun,
}) => {
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
            className="h-8 bg-primary-100/80 text-primary-300 hover:bg-primary-100/80 disabled:pointer-events-auto hover:text-primary-300 border-none animate-fade"
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
