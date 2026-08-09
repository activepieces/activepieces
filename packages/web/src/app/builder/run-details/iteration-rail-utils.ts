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

function fromStepOutputStatus(status: StepOutputStatus): RailDotStatus {
  switch (status) {
    case StepOutputStatus.FAILED:
      return 'failed';
    case StepOutputStatus.RUNNING:
      return 'running';
    case StepOutputStatus.PAUSED:
      return 'paused';
    case StepOutputStatus.STOPPED:
      return 'stopped';
    default:
      return 'succeeded';
  }
}

function dotClassName(status: RailDotStatus): string {
  switch (status) {
    case 'failed':
      return 'bg-destructive';
    case 'running':
      return 'bg-primary animate-pulse';
    case 'paused':
    case 'failedToDispatch':
      return 'bg-warning';
    case 'neverStarted':
      return 'bg-muted';
    default:
      return 'bg-success';
  }
}

function statusLabel(status: RailDotStatus): string {
  switch (status) {
    case 'failed':
      return t('Failed');
    case 'running':
      return t('Running');
    case 'paused':
      return t('Paused');
    case 'stopped':
      return t('Stopped');
    case 'failedToDispatch':
      return t('Failed to dispatch');
    case 'neverStarted':
      return t('Never started');
    default:
      return t('Succeeded');
  }
}

export const iterationRailUtils = {
  MAX_RENDERED_DOTS: 100,
  clampIndex,
  dotClassName,
  statusLabel,
  fromStepOutputStatus,
};

export type RailDotStatus =
  | 'succeeded'
  | 'failed'
  | 'running'
  | 'paused'
  | 'stopped'
  | 'failedToDispatch'
  | 'neverStarted';
