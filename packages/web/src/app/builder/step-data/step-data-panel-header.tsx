import { StepOutputStatus } from '@activepieces/shared';
import { t } from 'i18next';
import { Loader2 } from 'lucide-react';

import { StepStatusIcon } from '@/features/flow-runs';
import { formatUtils } from '@/lib/format-utils';
import { Status, statusColors } from '@/lib/status-colors';
import { StepNodeBadgeStatus } from '@/lib/statuses';
import { cn } from '@/lib/utils';

type StepDataPanelHeaderStatus =
  | 'success'
  | 'failed'
  | 'testing'
  | 'paused'
  | 'idle';
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
  const colors = statusColors.of(HEADER_STATUS[status]);

  return (
    <div
      className={cn(
        'flex items-center justify-between px-3 py-2 shrink-0 gap-2',
        colors.background,
        colors.text,
      )}
    >
      <StepDataPanelStatusBadge status={status} viewMode={viewMode} />
      {lastTestDate && status !== 'testing' && (
        <span className="text-xs truncate">
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
        <span className="font-medium">
          {viewMode === 'run' ? t('Failed') : t('Test Failed')}
        </span>
      </div>
    );
  }
  if (status === 'paused') {
    return (
      <div className="flex items-center gap-1.5 text-sm">
        <StepStatusIcon status={StepOutputStatus.PAUSED} size="4.5" />
        <span className="font-medium">{t('Paused')}</span>
      </div>
    );
  }
  if (status === 'testing') {
    return (
      <div className="flex items-center gap-1.5 text-sm">
        <Loader2 className="size-4 animate-spin" />
        <span className="font-medium">
          {viewMode === 'run' ? t('Running') : t('Testing...')}
        </span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1.5 text-sm">
      <StepStatusIcon status={StepOutputStatus.SUCCEEDED} size="4.5" />
      <span className="font-medium">
        {viewMode === 'run' ? t('Success') : t('Tested Successfully')}
      </span>
    </div>
  );
};

const HEADER_STATUS: Record<
  Exclude<StepDataPanelHeaderStatus, 'idle'>,
  Status
> = {
  success: StepOutputStatus.SUCCEEDED,
  failed: StepOutputStatus.FAILED,
  testing: StepNodeBadgeStatus.TESTING,
  paused: StepOutputStatus.PAUSED,
};

StepDataPanelHeader.displayName = 'StepDataPanelHeader';
export { StepDataPanelHeader };
