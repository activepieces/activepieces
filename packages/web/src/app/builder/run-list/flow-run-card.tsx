import { Permission } from '@activepieces/core-utils';
import {
  FlowRetryStrategy,
  FlowRun,
  FlowRunStatus,
  isFailedState,
  isFlowRunStateTerminal,
} from '@activepieces/shared';
import { t } from 'i18next';
import { Eye, Repeat, Timer } from 'lucide-react';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { CardListItem } from '@/components/custom/card-list';
import { ConfirmationDeleteDialog } from '@/components/custom/delete-dialog';
import { FormattedDate } from '@/components/custom/formatted-date';
import { PermissionNeededTooltip } from '@/components/custom/permission-needed-tooltip';
import { LoadingSpinner } from '@/components/custom/spinner';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { flowRunUtils } from '@/features/flow-runs';
import {
  flowRunMutations,
  flowRunQueries,
} from '@/features/flow-runs/hooks/flow-run-hooks';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { authenticationSession } from '@/lib/authentication-session';
import { formatUtils } from '@/lib/format-utils';
import { cn } from '@/lib/utils';

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
    const [isBatchRetryDialogOpen, setIsBatchRetryDialogOpen] =
      useState<boolean>(false);
    const mayProcessInBatches = flowRunQueries.useMayProcessInBatches({
      runs: [{ flowId: run.flowId, flowVersionId: run.flowVersionId }],
      hasUnknownRuns: false,
      enabled: isRetryDropdownOpen && isFailedState(run.status),
    });
    const { mutate: retryRun, isPending: isRetryingRun } =
      flowRunMutations.useRetryRun({
        onSuccess: ({ run }) => {
          refetchRuns();
          navigate(`/runs/${run.id}`);
        },
      });
    const retryFromFailedStep = () =>
      retryRun({
        runId: run.id,
        flowId: run.flowId,
        projectId: projectId!,
        retryStrategy: FlowRetryStrategy.FROM_FAILED_STEP,
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
              <Timer className="h-3.5 w-3.5" />
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
                        runId: run.id,
                        flowId: run.flowId,
                        projectId: projectId!,
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
                        if (isRetryingRun) {
                          return;
                        }
                        if (mayProcessInBatches) {
                          setIsBatchRetryDialogOpen(true);
                          return;
                        }
                        retryFromFailedStep();
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
          <ConfirmationDeleteDialog
            open={isBatchRetryDialogOpen}
            onOpenChange={setIsBatchRetryDialogOpen}
            title={t('Retry from failed step')}
            message={t('Are you sure you want to retry from the failed step?')}
            warning={t(
              'This flow processes items in batches. Batches that already succeeded run again — anything they write to external systems happens twice.',
            )}
            buttonText={t('Retry')}
            entityName={t('Run')}
            mutationFn={async () => retryFromFailedStep()}
          />
        </div>
      </CardListItem>
    );
  },
);

FlowRunCard.displayName = 'FlowRunCard';
export { FlowRunCard };
