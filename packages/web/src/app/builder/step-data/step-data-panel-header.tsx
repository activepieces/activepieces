import { StepOutputStatus } from '@activepieces/shared';
import { t } from 'i18next';
import { Loader2 } from 'lucide-react';

import { StepStatusIcon } from '@/features/flow-runs';
import { formatUtils } from '@/lib/format-utils';
import { cn } from '@/lib/utils';

type StepDataPanelHeaderStatus = 'success' | 'failed' | 'testing' | 'idle';
type StepDataPanelHeaderViewMode = 'edit' | 'run';

type StepDataPanelHeaderProps = {
  status: StepDataPanelHeaderStatus;
  lastTestDate?: string | null;
  viewMode?: StepDataPanelHeaderViewMode;
};

const StepDataPanelHeader = ({
  status,
  lastTestDate,
  viewMode = 'edit',
}: StepDataPanelHeaderProps) => {
  if (status === 'idle') {
    return null;
  }

  return (
    <div
      className={cn(
        'flex items-center justify-between px-3 py-2 shrink-0 gap-2',
        status === 'success' && 'bg-success-100',
        status === 'failed' && 'bg-destructive/10',
        status === 'testing' && 'bg-primary/10',
      )}
    >
      <StepDataPanelStatusBadge status={status} viewMode={viewMode} />
      {lastTestDate && status !== 'testing' && (
        <span
          className={cn(
            'text-xs truncate',
            status === 'success' && 'text-success-700/80',
            status === 'failed' && 'text-destructive/80',
          )}
        >
          {formatUtils.formatDateWithTime(new Date(lastTestDate), false)}
        </span>
      )}
    </div>
  );
};

type StepDataPanelStatusBadgeProps = {
  status: Exclude<StepDataPanelHeaderStatus, 'idle'>;
  viewMode: StepDataPanelHeaderViewMode;
};

const StepDataPanelStatusBadge = ({
  status,
  viewMode,
}: StepDataPanelStatusBadgeProps) => {
  if (status === 'failed') {
    return (
      <div className="flex items-center gap-1.5 text-sm">
        <StepStatusIcon status={StepOutputStatus.FAILED} size="4.5" />
        <span className="text-destructive-700 dark:text-destructive-200 font-medium">
          {viewMode === 'run' ? t('Failed') : t('Test Failed')}
        </span>
      </div>
    );
  }
  if (status === 'testing') {
    return (
      <div className="flex items-center gap-1.5 text-sm text-primary">
        <Loader2 className="size-4 animate-spin" />
        <span className="font-medium">{t('Testing...')}</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1.5 text-sm">
      <StepStatusIcon status={StepOutputStatus.SUCCEEDED} size="4.5" />
      <span className="text-success-700 font-medium">
        {viewMode === 'run' ? t('Success') : t('Tested Successfully')}
      </span>
    </div>
  );
};

StepDataPanelHeader.displayName = 'StepDataPanelHeader';
export { StepDataPanelHeader };
