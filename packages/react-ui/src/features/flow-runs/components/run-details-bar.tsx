import { QuestionMarkIcon } from '@radix-ui/react-icons';
import { t } from 'i18next';
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { flagsHooks } from '@/hooks/flags-hooks';
import { authenticationSession } from '@/lib/authentication-session';
import { cn, formatUtils } from '@/lib/utils';
import {
  ApFlagId,
  FlowRun,
  FlowRunStatus,
  isNil,
  Permission,
} from '@activepieces/shared';

import { useAuthorization } from '../../../hooks/authorization-hooks';
import { flowRunUtils } from '../lib/flow-run-utils';

type RunDetailsBarProps = {
  run: FlowRun | null;
  exitRun: (userHasPermissionToUpdateFlow: boolean) => void;
  isLoading: boolean;
};

function getStatusText(
  status: FlowRunStatus,
  timeout: number,
  memoryLimit: number,
) {
  switch (status) {
    case FlowRunStatus.SUCCEEDED:
      return t('Run Succeeded');
    case FlowRunStatus.FAILED:
      return t('Run Failed');
    case FlowRunStatus.PAUSED:
      return t('Flow Run is paused');
    case FlowRunStatus.QUOTA_EXCEEDED:
      return t('Run Failed due to quota exceeded');
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
  }
}

const RunDetailsBar = React.memo(
  ({ run, exitRun, isLoading }: RunDetailsBarProps) => {
    const { Icon, variant } = run
      ? flowRunUtils.getStatusIcon(run.status)
      : { Icon: QuestionMarkIcon, variant: 'default' };
    const navigate = useNavigate();

    const isInRunsPage = useLocation().pathname.includes('/runs/');
    const { data: timeoutSeconds } = flagsHooks.useFlag<number>(
      ApFlagId.FLOW_RUN_TIME_SECONDS,
    );
    const { data: memoryLimit } = flagsHooks.useFlag<number>(
      ApFlagId.FLOW_RUN_MEMORY_LIMIT_KB,
    );
    const { checkAccess } = useAuthorization();
    const userHasPermissionToEditFlow = checkAccess(Permission.WRITE_FLOW);

    if (!run) {
      return <></>;
    }
    const handleSwitchToDraft = () => {
      if (isInRunsPage) {
        navigate(
          authenticationSession.appendProjectRoutePrefix(
            `/flows/${run.flowId}`,
          ),
        );
      } else {
        exitRun(userHasPermissionToEditFlow);
      }
    };

    return (
      <div className="absolute bottom-4 p-4 left-1/2 transform -translate-x-1/2 w-[480px] bg-background shadow-lg border rounded-lg z-[9999]">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Icon
              className={cn('w-6 h-6 flex-shrink-0', {
                'text-foreground': variant === 'default',
                'text-success': variant === 'success',
                'text-destructive': variant === 'error',
              })}
            />
            <div className="flex flex-col gap-1 min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm font-medium text-foreground truncate">
                    {getStatusText(
                      run.status,
                      timeoutSeconds ?? -1,
                      memoryLimit ?? -1,
                    )}
                  </span>
                  {!isNil(run.tasks) && run.tasks > 0 && (
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-md font-medium flex-shrink-0">
                      {run.tasks} {t('tasks')}
                    </span>
                  )}
                </div>
                <span className="text-xs text-muted-foreground flex-shrink-0">
                  {formatUtils.formatDate(new Date(run.created))}
                </span>
              </div>
              <div className="text-xs text-muted-foreground">{run.id}</div>
            </div>
          </div>
          {
            <Button
              variant={'outline'}
              size="sm"
              onClick={handleSwitchToDraft}
              loading={isLoading}
              onKeyboardShortcut={handleSwitchToDraft}
              keyboardShortcut="Esc"
              className="flex-shrink-0"
              data-testId="exit-run-button"
            >
              {t('Edit Flow')}
            </Button>
          }
        </div>
      </div>
    );
  },
);

RunDetailsBar.displayName = 'RunDetailsBar';
export { RunDetailsBar };
