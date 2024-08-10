import { QuestionMarkIcon } from '@radix-ui/react-icons';
import { useQueryClient } from '@tanstack/react-query';
import React from 'react';

import { Button } from '@/components/ui/button';
import { flagsHooks } from '@/hooks/flags-hooks';
import { cn } from '@/lib/utils';
import { ApFlagId, FlowRun, FlowRunStatus } from '@activepieces/shared';

import { flowRunUtils } from '../lib/flow-run-utils';

type RunDetailsBarProps = {
  run?: FlowRun;
  canExitRun: boolean;
  exitRun: () => void;
};

function getStatusText(status: FlowRunStatus, timeout: number) {
  switch (status) {
    case FlowRunStatus.STOPPED:
    case FlowRunStatus.SUCCEEDED:
      return 'Run Succeeded';
    case FlowRunStatus.FAILED:
      return 'Run Failed';
    case FlowRunStatus.PAUSED:
      return 'Flow Run is paused';
    case FlowRunStatus.QUOTA_EXCEEDED:
      return 'Run Failed due to quota exceeded';
    case FlowRunStatus.RUNNING:
      return 'Running';
    case FlowRunStatus.TIMEOUT:
      return `Run exceeded ${timeout} seconds, try to optimize your steps.`;
    case FlowRunStatus.INTERNAL_ERROR:
      return 'Run failed for an unknown reason, contact support.';
  }
}
const RunDetailsBar = React.memo(
  ({ run, canExitRun, exitRun }: RunDetailsBarProps) => {
    const { Icon, variant } = run
      ? flowRunUtils.getStatusIcon(run.status)
      : { Icon: QuestionMarkIcon, variant: 'default' };

    const queryClient = useQueryClient();
    const { data: timeoutSeconds } = flagsHooks.useFlag<number>(
      ApFlagId.FLOW_RUN_TIME_SECONDS,
      queryClient,
    );

    if (!run) {
      return <></>;
    }

    return (
      <div
        className="fixed bottom-4 p-4 left-1/2 transform -translate-x-1/2 w-[400px] bg-background shadow-lg border h-16 flex items-center justify-start 
       rounded-lg z-[9999]"
      >
        <Icon
          className={cn('w-6 h-6 mr-3', {
            'text-foreground': variant === 'default',
            'text-success': variant === 'success',
            'text-destructive': variant === 'error',
          })}
        />
        <div className="flex-col flex flex-grow text-foreground gap-0">
          <div className="text-sm">
            {getStatusText(run.status, timeoutSeconds ?? -1)}
          </div>
          <div className="text-xs text-muted-foreground">
            {run?.id ?? 'Unknown'}
          </div>
        </div>
        {canExitRun && (
          <Button variant={'outline'} onClick={exitRun}>
            Exit Run
          </Button>
        )}
      </div>
    );
  },
);

RunDetailsBar.displayName = 'RunDetailsBar';
export { RunDetailsBar };
