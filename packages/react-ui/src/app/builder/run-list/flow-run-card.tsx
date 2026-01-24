import { StopwatchIcon } from '@radix-ui/react-icons';
import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { Eye, Repeat } from 'lucide-react';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { CardListItem } from '@/components/custom/card-list';
import { PermissionNeededTooltip } from '@/components/custom/permission-needed-tooltip';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from '@/components/ui/dropdown-menu';
import { FormattedDate } from '@/components/ui/formatted-date';
import { LoadingSpinner } from '@/components/ui/spinner';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
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
    const navigate = useNavigate();

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
            versionId: updatedRun.flowVersionId,
          });
          return {
            run: updatedRun,
            populatedFlow,
          };
        }
        throw Error("Project id isn't defined");
      },
      onSuccess: ({ run }) => {
        refetchRuns();
        navigate(`/runs/${run.id}`);
      },
    });

    return (
      <CardListItem
        className={cn('px-3 group', {
          'bg-accent text-accent-foreground': run.id === viewedRunId,
        })}
        style={{ height: `${FLOW_CARD_HEIGHT}px` }}
        onClick={() => {
          navigate(`/runs/${run.id}`);
        }}
        key={run.id}
      >
        <div>
          <span>
            {run.status === FlowRunStatus.CANCELED ? (
              <Tooltip>
                <TooltipTrigger>
                  <Icon
                    className={cn('w-5 h-5', {
                      'text-success': variant === 'success',
                      'text-destructive': variant === 'error',
                    })}
                  />
                </TooltipTrigger>
                <TooltipContent>{t('Canceled')}</TooltipContent>
              </Tooltip>
            ) : (
              <Icon
                className={cn('w-5 h-5', {
                  'text-success': variant === 'success',
                  'text-destructive': variant === 'error',
                })}
              />
            )}
          </span>
        </div>
        <div className="grid gap-2">
          <div className="text-sm font-medium leading-none flex gap-2 items-center">
            <FormattedDate
              date={new Date(run.created ?? new Date())}
              includeTime={true}
              className="text-sm font-medium leading-none select-none cursor-default"
            ></FormattedDate>
            {run.id === viewedRunId && <Eye className="w-3.5 h-3.5"></Eye>}
          </div>
          {isFlowRunStateTerminal({
            status: run.status,
            ignoreInternalError: false,
          }) && (
            <p className="flex gap-1 text-xs text-muted-foreground">
              <StopwatchIcon className="h-3.5 w-3.5" />
              {t('Took')}{' '}
              {formatUtils.formatDuration(
                run.startTime && run.finishTime
                  ? new Date(run.finishTime).getTime() -
                      new Date(run.startTime).getTime()
                  : undefined,
                false,
              )}
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
          {isRetryingRun && (
            <LoadingSpinner className="size-4"></LoadingSpinner>
          )}

          {!isRetryingRun && (
            <PermissionNeededTooltip
              hasPermission={userHasPermissionToRetryRun}
            >
              <DropdownMenu
                modal={false}
                open={isRetryDropdownOpen}
                onOpenChange={setIsRetryDropdownOpen}
              >
                <Tooltip>
                  <TooltipTrigger>
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
                        <Repeat className="w-4 h-4"></Repeat>
                      </Button>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent>{t('Retry run')}</TooltipContent>
                </Tooltip>
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
                      <span>{t('On latest version')}</span>
                    </div>
                  </DropdownMenuItem>

                  {isFailedState(run.status) && (
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
                        <span>{t('From failed step')}</span>
                      </div>
                    </DropdownMenuItem>
                  )}
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
