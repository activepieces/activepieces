import { StepOutputStatus } from '@activepieces/shared';
import { t } from 'i18next';
import { Loader2 } from 'lucide-react';

import { StepStatusIcon } from '@/features/flow-runs';
import { formatUtils } from '@/lib/format-utils';
import { cn } from '@/lib/utils';

type TestPanelHeaderStatus = 'success' | 'failed' | 'testing' | 'idle';

type TestPanelHeaderProps = {
  status: TestPanelHeaderStatus;
  lastTestDate?: string | null;
};

const TestPanelHeader = ({ status, lastTestDate }: TestPanelHeaderProps) => {
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
      <TestPanelStatusBadge status={status} />
      {lastTestDate && (
        <span
          className={cn(
            'text-xs truncate',
            status === 'success' && 'text-success-700/80',
            status === 'failed' && 'text-destructive/80',
            status === 'testing' && 'text-primary/80',
          )}
        >
          {formatUtils.formatDateWithTime(new Date(lastTestDate), false)}
        </span>
      )}
    </div>
  );
};

type TestPanelStatusBadgeProps = {
  status: Exclude<TestPanelHeaderStatus, 'idle'>;
};

const TestPanelStatusBadge = ({ status }: TestPanelStatusBadgeProps) => {
  if (status === 'failed') {
    return (
      <div className="flex items-center gap-1.5 text-sm text-destructive">
        <StepStatusIcon status={StepOutputStatus.FAILED} size="4.5" />
        <span>{t('Testing Failed')}</span>
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
      <span className="text-success-700 font-medium">{t('Tested')}</span>
    </div>
  );
};

TestPanelHeader.displayName = 'TestPanelHeader';
export { TestPanelHeader };
