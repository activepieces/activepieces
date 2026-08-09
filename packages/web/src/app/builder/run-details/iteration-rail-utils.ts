import { StepOutputStatus } from '@activepieces/shared';
import { t } from 'i18next';

function clampIndex({
  value,
  total,
}: {
  value: string;
  total: number;
}): number {
  const parsed = parseInt(value);
  return Math.max(1, Math.min(Number.isNaN(parsed) ? 1 : parsed, total)) - 1;
}

function dotClassName(status: StepOutputStatus): string {
  switch (status) {
    case StepOutputStatus.FAILED:
      return 'bg-destructive';
    case StepOutputStatus.RUNNING:
      return 'bg-primary animate-pulse';
    case StepOutputStatus.PAUSED:
      return 'bg-warning';
    default:
      return 'bg-success';
  }
}

function statusLabel(status: StepOutputStatus): string {
  switch (status) {
    case StepOutputStatus.FAILED:
      return t('Failed');
    case StepOutputStatus.RUNNING:
      return t('Running');
    case StepOutputStatus.PAUSED:
      return t('Paused');
    case StepOutputStatus.STOPPED:
      return t('Stopped');
    default:
      return t('Succeeded');
  }
}

export const iterationRailUtils = { clampIndex, dotClassName, statusLabel };
