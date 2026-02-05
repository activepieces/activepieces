import { QuestionMarkIcon } from '@radix-ui/react-icons';
import { t } from 'i18next';

import { flowRunUtils } from '@/features/flow-runs/lib/flow-run-utils';
import { flagsHooks } from '@/hooks/flags-hooks';
import { cn, formatUtils } from '@/lib/utils';
import {
  ApFlagId,
  FlowRunStatus,
  isFlowRunStateTerminal,
} from '@activepieces/shared';

import { EditFlowOrViewDraftButton } from '../../builder-header/flow-status/view-draft-or-edit-flow-button';
import { useBuilderStateContext } from '../../builder-hooks';

import LargeWidgetWrapper from './large-widget-wrapper';

function getStatusText({
  status,
  timeout,
  memoryLimit,
}: {
  status: FlowRunStatus;
  timeout: number;
  memoryLimit: number;
}) {
  switch (status) {
    case FlowRunStatus.SUCCEEDED:
      return t('Run Succeeded');
    case FlowRunStatus.FAILED:
      return t('Run Failed');
    case FlowRunStatus.PAUSED:
      return t('Run Paused');
    case FlowRunStatus.QUOTA_EXCEEDED:
      return t('Quota Exceeded');
    case FlowRunStatus.MEMORY_LIMIT_EXCEEDED:
      return t(
        'Run failed due to exceeding the memory limit of {memoryLimit} MB',
        {
          memoryLimit: Math.floor(memoryLimit / 1024),
        },
      );
    case FlowRunStatus.QUEUED:
      return t('Queued');
    case FlowRunStatus.RUNNING:
      return t('Running');
    case FlowRunStatus.TIMEOUT:
      return t('Run exceeded {timeout} seconds, try to optimize your steps.', {
        timeout,
      });
    case FlowRunStatus.INTERNAL_ERROR:
      return t('Run failed for an unknown reason, contact support.');
    case FlowRunStatus.CANCELED:
      return t('Run Cancelled');
  }
}

const RunInfoWidget = () => {
  const [run] = useBuilderStateContext((state) => [state.run]);
  const { variant, Icon } = run
    ? flowRunUtils.getStatusIcon(run.status)
    : { variant: 'default' as const, Icon: QuestionMarkIcon };
  const { data: timeoutSeconds } = flagsHooks.useFlag<number>(
    ApFlagId.FLOW_RUN_TIME_SECONDS,
  );
  const { data: memoryLimit } = flagsHooks.useFlag<number>(
    ApFlagId.FLOW_RUN_MEMORY_LIMIT_KB,
  );
  if (!run) {
    return null;
  }
  const isRunTerminal = isFlowRunStateTerminal({
    status: run.status,
    ignoreInternalError: false,
  });
  return (
    <LargeWidgetWrapper
      containerClassName={cn(
        flowRunUtils.getStatusContainerClassName(variant),
        'bg-background border border-border dark:bg-background dark:border-border',
      )}
      key={run.id + run.status}
    >
      <div className="flex items-center justify-between w-full flex-wrap">
        <div className="flex items-center text-sm shrink-0">
          <Icon className="size-5 mr-2" />
          <span className="text-foreground dark:text-foreground font-medium">
            {getStatusText({
              status: run.status,
              timeout: timeoutSeconds ?? -1,
              memoryLimit: memoryLimit ?? -1,
            })}
          </span>

          <div className="shrink-0 text-foreground dark:text-foreground">
            {isRunTerminal && (
              <>
                &nbsp;-&nbsp;
                {run.startTime && (
                  <DateSection
                    text={t('Started')}
                    dateOrDuration={formatUtils.formatDateWithTime(
                      new Date(run.startTime),
                      true,
                    )}
                  />
                )}
                {', '}
                {run.finishTime && run.startTime && (
                  <DateSection
                    text={t('Took')}
                    dateOrDuration={formatUtils.formatDuration(
                      new Date(run.finishTime).getTime() -
                        new Date(run.startTime).getTime(),
                    )}
                  />
                )}
              </>
            )}
          </div>
        </div>

        <EditFlowOrViewDraftButton onCanvas={false}></EditFlowOrViewDraftButton>
      </div>
    </LargeWidgetWrapper>
  );
};
RunInfoWidget.displayName = 'RunInfoWidget';
export { RunInfoWidget };

const DateSection = ({
  text,
  dateOrDuration,
}: {
  text: string;
  dateOrDuration: string;
}) => {
  return (
    <>
      <span>{`${text}: `}</span>
      <span>{`${dateOrDuration}`}</span>
    </>
  );
};
