import { isNil } from '@activepieces/core-utils';
import { t } from 'i18next';
import { Info } from 'lucide-react';
import { ReactNode } from 'react';
import { Link } from 'react-router-dom';

import { authenticationSession } from '@/lib/authentication-session';

import { ClosePanelButton } from '../step-data/close-panel-button';
import { StepDataPanelViewToggle } from '../step-data/step-data-panel-view-toggle';

import { BatchLogs } from './use-batch-logs';

const BatchLogsPanel = ({ batchLogs }: { batchLogs: BatchLogs }) => {
  const copy = missingLogsCopy(batchLogs.kind);
  if (isNil(copy)) {
    return <></>;
  }
  return (
    <EmptyStatePanel title={copy.title} description={copy.description}>
      {!isNil(batchLogs.childRunId) && (
        <Link
          className="text-xs text-primary underline"
          to={authenticationSession.appendProjectRoutePrefix(
            `/runs/${batchLogs.childRunId}`,
          )}
        >
          {t('Open this batch as a run')}
        </Link>
      )}
    </EmptyStatePanel>
  );
};

const BatchSkippedPanel = () => (
  <EmptyStatePanel
    title={t('No batches dispatched')}
    description={t(
      'Items resolved to an empty array, so nothing ran. The flow continued to the next step.',
    )}
  />
);

const EmptyStatePanel = ({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: ReactNode;
}) => (
  <div className="flex flex-col h-full w-full">
    <div className="flex items-center justify-end gap-1 px-3 py-2 shrink-0">
      <StepDataPanelViewToggle />
      <ClosePanelButton />
    </div>
    <div className="grow flex flex-col items-center justify-center w-full px-6 py-10 gap-4 text-center">
      <div className="flex items-center justify-center size-12 rounded-full bg-muted text-muted-foreground">
        <Info className="size-6" />
      </div>
      <div className="flex flex-col gap-1.5 max-w-[280px]">
        <span className="text-sm font-medium text-foreground">{title}</span>
        <span className="text-xs text-muted-foreground leading-relaxed">
          {description}
        </span>
      </div>
      {children}
    </div>
  </div>
);

function missingLogsCopy(
  kind: BatchLogs['kind'],
): { title: string; description: string } | null {
  switch (kind) {
    case 'neverStarted':
      return {
        title: t('This batch never started'),
        description: t(
          'It was never picked up by a worker, so it has no logs of its own.',
        ),
      };
    case 'failedToDispatch':
      return {
        title: t('This batch failed to dispatch'),
        description: t(
          'It was never handed to a worker, so it has no logs of its own.',
        ),
      };
    case 'stillRunning':
      return {
        title: t('This batch is still running'),
        description: t(
          'The parent finished without it, and its writes may still land.',
        ),
      };
    case 'logsExpired':
      return {
        title: t('Logs no longer available'),
        description: t(
          'This batch ran, but its logs are past the retention window. The summary on the step above is what remains.',
        ),
      };
    default:
      return null;
  }
}

export { BatchLogsPanel, BatchSkippedPanel, EmptyStatePanel };
