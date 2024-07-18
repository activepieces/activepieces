import { StopwatchIcon } from '@radix-ui/react-icons';
import { useMutation } from '@tanstack/react-query';
import { ChevronRightIcon } from 'lucide-react';
import React from 'react';

import { Button } from '@/components/ui/button';
import { CardListItem } from '@/components/ui/card-list';
import { LoadingSpinner } from '@/components/ui/spinner';
import { INTERNAL_ERROR_TOAST, toast } from '@/components/ui/use-toast';
import { flowRunUtils } from '@/features/flow-runs/lib/flow-run-utils';
import { flowRunsApi } from '@/features/flow-runs/lib/flow-runs-api';
import { flowsApi } from '@/features/flows/lib/flows-api';
import { LeftSideBarType, useBuilderStateContext } from '@/hooks/builder-hooks';
import { cn, formatUtils } from '@/lib/utils';
import { FlowRun, PopulatedFlow } from '@activepieces/shared';
type FlowRunCardProps = {
  run: FlowRun;
};

const FlowRunCard = React.memo((params: FlowRunCardProps) => {
  const { run } = params;
  const { Icon, varient } = flowRunUtils.getStatusIcon(run.status);
  const { setLeftSidebar, setRun } = useBuilderStateContext((state) => state);

  const { mutate, isPending } = useMutation<
    {
      run: FlowRun;
      populatedFlow: PopulatedFlow;
    },
    Error,
    string
  >({
    mutationFn: async (flowRunId) => {
      const run = await flowRunsApi.getPopulated(flowRunId);
      const populatedFlow = await flowsApi.get(run.flowId, {
        versionId: run.flowVersionId,
      });
      return {
        run,
        populatedFlow,
      };
    },
    onSuccess: ({ run, populatedFlow }) => {
      setRun(run, populatedFlow.version);
      setLeftSidebar(LeftSideBarType.RUN_DETAILS);
    },
    onError: (error) => {
      toast(INTERNAL_ERROR_TOAST);
      console.error(error);
    },
  });

  return (
    <CardListItem
      onClick={() => {
        if (isPending) {
          return;
        }
        mutate(run.id);
      }}
      key={run.id}
    >
      <div>
        <span>
          <Icon
            className={cn('w-5 h-5', {
              'text-success': varient === 'success',
              'text-destructive': varient === 'error',
            })}
          />
        </span>
      </div>
      <div className="grid gap-2">
        <p className="text-sm font-medium leading-none">
          {formatUtils.formatDate(new Date(run.startTime))}
        </p>
        <p className="flex gap-1 text-xs text-muted-foreground">
          <StopwatchIcon />
          Took {formatUtils.formatDuration(run.duration, false)}
        </p>
      </div>
      <div className="ml-auto font-medium">
        <Button variant="ghost" disabled={isPending}>
          {isPending && <LoadingSpinner className="w-5 h-5" />}
          {!isPending && <ChevronRightIcon className="w-5 h-5" />}
        </Button>
      </div>
    </CardListItem>
  );
});

FlowRunCard.displayName = 'FlowRunCard';
export { FlowRunCard };
