import { FlowMigration } from '@activepieces/shared';
import { t } from 'i18next';
import { AlertTriangle } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import { useMigrationFlowsGroupedByProject } from '../hooks/ai-provider-migration-hooks';

import { FlowLink, ProjectGroupedFlowList } from './project-grouped-flow-list';

type FailedFlowVersion = FlowMigration['failedFlowVersions'][number];

export function FailedMigrationsDialog({
  open,
  onOpenChange,
  failedFlowVersions,
}: FailedMigrationsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('Failed Migrations')}</DialogTitle>
        </DialogHeader>
        {open && (
          <FailedMigrationsDialogContent
            failedFlowVersions={failedFlowVersions}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function FailedMigrationsDialogContent({
  failedFlowVersions,
}: {
  failedFlowVersions: FailedFlowVersion[];
}) {
  const { groups, isLoading } = useMigrationFlowsGroupedByProject({
    entries: failedFlowVersions,
  });

  return (
    <ProjectGroupedFlowList
      entries={failedFlowVersions}
      groups={groups}
      isLoading={isLoading}
      renderRow={({ flowId, entries, displayName, projectId }) => (
        <li
          key={flowId}
          className="flex items-start gap-3 rounded-md border p-3"
        >
          <AlertTriangle className="size-4 shrink-0 text-destructive mt-0.5" />
          <div className="flex flex-col gap-1 min-w-0">
            <FlowLink
              projectId={projectId}
              flowId={flowId}
              displayName={displayName}
            />
            {entries.map((entry) => (
              <p
                key={entry.flowVersionId}
                className="text-xs text-muted-foreground whitespace-pre-line"
              >
                {entry.error}
              </p>
            ))}
          </div>
        </li>
      )}
    />
  );
}

type FailedMigrationsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  failedFlowVersions: FailedFlowVersion[];
};
