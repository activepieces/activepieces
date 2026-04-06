import {
  ApFlagId,
  ErrorCode,
  FlowRunWithRetryError,
} from '@activepieces/shared';
import { t } from 'i18next';
import { ExternalLink } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { flowRunUtils } from '@/features/flow-runs/utils/flow-run-utils';
import { flagsHooks } from '@/hooks/flags-hooks';
import { authenticationSession } from '@/lib/authentication-session';
import { formatUtils } from '@/lib/format-utils';
import { useNewWindow } from '@/lib/navigation-utils';
import { cn } from '@/lib/utils';

type FailedRetryRunsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  failedRuns: Required<FlowRunWithRetryError>[];
};

export const FailedRetryRunsDialog = ({
  open,
  onOpenChange,
  failedRuns,
}: FailedRetryRunsDialogProps) => {
  const openNewWindow = useNewWindow();
  const { data: retentionDays } = flagsHooks.useFlag<number>(
    ApFlagId.EXECUTION_DATA_RETENTION_DAYS,
  );
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('Failed Retries')}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[400px]">
          <ul className="flex flex-col gap-3 pr-3">
            {failedRuns.map((run) => {
              const { Icon, variant } = flowRunUtils.getStatusIcon(run.status);
              return (
                <li
                  key={run.id}
                  className="flex items-start justify-between gap-3 rounded-md border p-3"
                >
                  <div className="flex flex-col gap-1 min-w-0">
                    <div className="flex items-center gap-1.5 text-sm font-medium">
                      <Icon
                        className={cn('size-4 shrink-0', {
                          'text-destructive': variant === 'error',
                          'text-success': variant === 'success',
                          'text-muted-foreground': variant === 'default',
                        })}
                      />
                      <span className="truncate">
                        {t('Previous status')}:{' '}
                        {formatUtils.convertEnumToHumanReadable(run.status)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {run.error?.errorCode ===
                      ErrorCode.FLOW_RUN_RETRY_OUTSIDE_RETENTION
                        ? t(
                            'Retry is only available for {failedJobRetentionDays} after a run fails.',
                            {
                              failedJobRetentionDays: retentionDays,
                            },
                          )
                        : run.error.errorMessage ?? t('Internal server error')}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="shrink-0"
                    onClick={() =>
                      openNewWindow(
                        authenticationSession.appendProjectRoutePrefix(
                          `/runs/${run.id}`,
                        ),
                      )
                    }
                  >
                    <ExternalLink className="size-4" />
                    <span className="sr-only">{t('Open run')}</span>
                  </Button>
                </li>
              );
            })}
          </ul>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
