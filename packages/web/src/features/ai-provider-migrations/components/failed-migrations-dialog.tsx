import { FlowMigration } from '@activepieces/shared';
import { t } from 'i18next';
import { AlertTriangle } from 'lucide-react';

import { MigrationFlowRow } from '../utils';

import { FlowsListDialog } from './flows-list-dialog';

type FailedFlowVersion = FlowMigration['failedFlowVersions'][number];

export function FailedMigrationsDialog({
  open,
  onOpenChange,
  failedFlowVersions,
}: FailedMigrationsDialogProps) {
  return (
    <FlowsListDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('Failed Migrations')}
      entries={failedFlowVersions}
      renderRow={({ flowId, entries, displayName, projectId }) => (
        <MigrationFlowRow
          icon={
            <AlertTriangle className="size-4 shrink-0 text-destructive mt-0.5" />
          }
          projectId={projectId}
          flowId={flowId}
          displayName={displayName}
        >
          {entries.map((entry) => (
            <p
              key={entry.flowVersionId}
              className="text-xs text-muted-foreground whitespace-pre-line"
            >
              {entry.error}
            </p>
          ))}
        </MigrationFlowRow>
      )}
    />
  );
}

type FailedMigrationsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  failedFlowVersions: FailedFlowVersion[];
};
