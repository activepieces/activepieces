import { StopwatchIcon } from '@radix-ui/react-icons';
import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { Eye, Redo, RefreshCcw, RotateCw } from 'lucide-react';
import React, { useState } from 'react';

import {
  LeftSideBarType,
  useBuilderStateContext,
} from '@/app/builder/builder-hooks';
import { CardListItem } from '@/components/custom/card-list';
import { PermissionNeededTooltip } from '@/components/custom/permission-needed-tooltip';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from '@/components/ui/dropdown-menu';
import { LoadingSpinner } from '@/components/ui/spinner';
import { flowRunUtils } from '@/features/flow-runs/lib/flow-run-utils';
import { flowRunsApi } from '@/features/flow-runs/lib/flow-runs-api';
import { flowsApi } from '@/features/flows/lib/flows-api';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { authenticationSession } from '@/lib/authentication-session';
import { cn, formatUtils } from '@/lib/utils';
import {
  FlowRetryStrategy,
  FlowRun,
  FlowRunStatus,
  isFailedState,
  isFlowRunStateTerminal,
  Permission,
  PopulatedFlow,
} from '@activepieces/shared';

type FlowRunCardProps = {
  run: FlowRun;
  viewedRunId?: string;
  refetchRuns: () => void;
};

export const FLOW_CARD_HEIGHT = 70;
const FlowRunCard = React.memo(
  ({ run, viewedRunId, refetchRuns }: FlowRunCardProps) => {
    const { Icon, variant } = flowRunUtils.getStatusIcon(run.status);
    const userHasPermissionToRetryRun = useAuthorization().checkAccess(
      Permission.WRITE_RUN,
    );
    const projectId = authenticationSession.getProjectId();

    const [setLeftSidebar, setRun] = useBuilderStateContext((state) => [
      state.setLeftSidebar,
      state.setRun,
    ]);
    const { mutate: viewRun, isPending: isFetchingRun } = useMutation<
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
        refetchRuns();
      },
    });
    const [isRetryDropdownOpen, setIsRetryDropdownOpen] =
      useState<boolean>(false);

    const { mutate: retryRun, isPending: isRetryingRun } = useMutation<
      {
        run: FlowRun;
        populatedFlow: PopulatedFlow;
      },
      Error,
      {
        run: FlowRun;
        retryStrategy: FlowRetryStrategy;
      }
    >({
      mutationFn: async ({ run, retryStrategy }) => {
        if (projectId) {
          const updatedRun = await flowRunsApi.retry(run.id, {
            projectId,
            strategy: retryStrategy,
          });
          const populatedFlow = await flowsApi.get(run.flowId, {
            versionId: run.flowVersionId,
          });
          return {
            run: updatedRun,
            populatedFlow,
          };
        }
        throw Error("Project id isn't defined");
      },
      onSuccess: ({ populatedFlow, run }) => {
        refetchRuns();
        setRun(run, populatedFlow.version);
        setLeftSidebar(LeftSideBarType.RUN_DETAILS);
      },
    });

    return (
      <CardListItem
        className={'px-3 group'}
        style={{ height: `${FLOW_CARD_HEIGHT}px` }}
        onClick={() => {
          if (!isFetchingRun) {
            viewRun(run.id);
          }
        }}
        key={run.id}
      >
        <div>
          <span>
            <Icon
              className={cn('w-5 h-5', {
                'text-success': variant === 'success',
                'text-destructive': variant === 'error',
              })}
            />
          </span>
        </div>
        <div className="grid gap-2">
          <div className="text-sm font-medium leading-none flex gap-2 items-center">
            {formatUtils.formatDate(new Date(run.startTime))}{' '}
            {run.id === viewedRunId && <Eye className="w-3.5 h-3.5"></Eye>}
          </div>
          {isFlowRunStateTerminal({
            status: run.status,
            ignoreInternalError: false,
          }) && (
            <p className="flex gap-1 text-xs text-muted-foreground">
              <StopwatchIcon className="h-3.5 w-3.5" />
              {t('Took')} {formatUtils.formatDuration(run.duration, false)}
            </p>
          )}
          {run.status === FlowRunStatus.RUNNING && (
            <p className="flex gap-1 text-xs text-muted-foreground">
              {t('Running')}...
            </p>
          )}
          {run.status === FlowRunStatus.QUEUED && (
            <p className="flex gap-1 text-xs text-muted-foreground">
              {t('Queued')}...
            </p>
          )}
        </div>
        <div className="ml-auto font-medium">
          {(isFetchingRun || isRetryingRun) && (
            <Button variant="ghost">
              <LoadingSpinner className="size-4"></LoadingSpinner>
            </Button>
          )}

          {!isFetchingRun && !isRetryingRun && isFailedState(run.status) && (
            <PermissionNeededTooltip
              hasPermission={userHasPermissionToRetryRun}
            >
              <DropdownMenu
                modal={false}
                open={isRetryDropdownOpen}
                onOpenChange={setIsRetryDropdownOpen}
              >
                <DropdownMenuTrigger>
                  <Button
                    variant="ghost"
                    size={'icon'}
                    className={cn(
                      'group-hover:opacity-100 opacity-0 rounded-full bg-accent drop-shadow-md',
                      {
                        'opacity-100': isRetryDropdownOpen,
                      },
                    )}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                  >
                    <RefreshCcw className="w-4 h-4"></RefreshCcw>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem
                    disabled={!userHasPermissionToRetryRun}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      retryRun({
                        run,
                        retryStrategy: FlowRetryStrategy.ON_LATEST_VERSION,
                      });
                    }}
                    className="cursor-pointer"
                  >
                    <div className="flex flex-row gap-2 items-center">
                      <RotateCw className="h-4 w-4" />
                      <span>{t('on latest version')}</span>
                    </div>
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (!isRetryingRun) {
                        retryRun({
                          run,
                          retryStrategy: FlowRetryStrategy.FROM_FAILED_STEP,
                        });
                      }
                    }}
                    className="cursor-pointer"
                  >
                    <div className="flex flex-row gap-2 items-center">
                      <Redo className="h-4 w-4" />
                      <span>{t('from failed step')}</span>
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </PermissionNeededTooltip>
          )}
        </div>
      </CardListItem>
    );
  },
);

FlowRunCard.displayName = 'FlowRunCard';
export { FlowRunCard };
