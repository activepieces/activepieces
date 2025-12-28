import { QuestionMarkIcon } from '@radix-ui/react-icons';
import { t } from 'i18next';
import React from 'react';

import { CopyButton } from '@/components/custom/clipboard/copy-button';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';
import { flagsHooks } from '@/hooks/flags-hooks';
import { cn, formatUtils } from '@/lib/utils';
import { ApFlagId, FlowRun, FlowRunStatus } from '@activepieces/shared';

import { flowRunUtils } from '../lib/flow-run-utils';

type RunStatusProps = {
  run: FlowRun | null;
};

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

const RunStatus = React.memo(({ run }: RunStatusProps) => {
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
    return <></>;
  }

  return (
    <div className="absolute top-[8px]  left-[12px] rounded-md bg-builder-background z-50">
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              'flex items-center gap-1 animate-in fade-in slide-in-from-top duration-500 !text-sm select-none',
              flowRunUtils.getStatusContainerClassName(variant),
            )}
          >
            <Icon className="w-4 h-4" />
            {getStatusText({
              status: run.status,
              timeout: timeoutSeconds ?? -1,
              memoryLimit: memoryLimit ?? -1,
            })}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="flex flex-col gap-1 text-sm cursor-default">
            {run.startTime && (
              <div className="flex flex-col gap-0.5 select-none">
                <span className="text-accent/70 text-xs">
                  {t('Started At')}
                </span>
                <span>
                  {formatUtils.formatDateWithTime(
                    new Date(run.startTime),
                    true,
                  )}
                </span>
              </div>
            )}
            {run.finishTime && run.startTime && (
              <div className="flex flex-col gap-0.5 select-none">
                <span className="text-accent/70 text-xs">{t('Took')}</span>
                <span>
                  {formatUtils.formatDuration(
                    run.startTime && run.finishTime
                      ? new Date(run.finishTime).getTime() -
                          new Date(run.startTime).getTime()
                      : undefined,
                    false,
                  )}
                </span>
              </div>
            )}
            <div className="flex items-center gap-2 cursor-pointer justify-between">
              {' '}
              <CopyButton
                withoutTooltip={true}
                variant="ghost"
                className="p-0 hover:bg-transparent font-normal !text-background flex items-center gap-1 justify-between !p-0"
                textToCopy={run.id}
              >
                {t('Copy Run ID')}
              </CopyButton>{' '}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </div>
  );
});

RunStatus.displayName = 'RunStatus';
export { RunStatus };
