import { isNil } from '@activepieces/core-utils';
import { t } from 'i18next';
import { Info } from 'lucide-react';
import { ReactNode } from 'react';
import { Link } from 'react-router-dom';

import { authenticationSession } from '@/lib/authentication-session';

import { ClosePanelButton } from '../step-data/close-panel-button';
import { StepDataPanelViewToggle } from '../step-data/step-data-panel-view-toggle';

import { batchUtils } from './batch-utils';
import { BatchLogs } from './use-batch-logs';

const BatchLogsPanel = ({ batchLogs }: { batchLogs: BatchLogs }) => {
  const copy = batchUtils.missingLogsCopy(batchLogs.kind);
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

export { BatchLogsPanel, EmptyStatePanel };
