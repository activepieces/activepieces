import { StopwatchIcon } from '@radix-ui/react-icons';
import { useMutation } from '@tanstack/react-query';
import { ChevronRightIcon } from 'lucide-react';
import React from 'react';

import { Button } from '@/components/ui/button';
import { CardListItem } from '@/components/ui/card-list';
import { LoadingSpinner } from '@/components/ui/spinner';
import { flowRunsApi } from '@/features/flow-runs/lib/flow-runs-api';
import { LeftSideBarType, useBuilderStateContext } from '@/hooks/builder-hooks';
import { formatUtils } from '@/lib/utils';
import { FlowRun } from '@activepieces/shared';
import { INTERNAL_ERROR_TOAST, toast } from '@/components/ui/use-toast';

type FlowRunCardProps = {
  run: FlowRun;
};

const FlowRunCard = React.memo((params: FlowRunCardProps) => {
  const { run } = params;
  const { setLeftSidebar, setRun } = useBuilderStateContext((state) => state);

  const { mutate, isPending } = useMutation<FlowRun, Error, string>({
    mutationFn: (flowRunId) => flowRunsApi.getPopulated(flowRunId),
    onSuccess: (run) => {
      setRun(run);
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
