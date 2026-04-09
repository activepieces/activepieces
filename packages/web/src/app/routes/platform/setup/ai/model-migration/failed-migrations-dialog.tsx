import { FlowAiProviderMigration, PopulatedFlow } from '@activepieces/shared';
import { useQuery } from '@tanstack/react-query';
import { t } from 'i18next';
import { AlertTriangle, Loader2 } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { flowsApi } from '@/features/flows';

type FailedFlowVersion = FlowAiProviderMigration['failedFlowVersions'][number];

type GroupedFailure = {
  flowId: string;
  flowDisplayName: string;
  versions: FailedFlowVersion[];
};

export function FailedMigrationsDialog({
  open,
  onOpenChange,
  failedFlowVersions,
}: FailedMigrationsDialogProps) {
  const uniqueFlowIds = [...new Set(failedFlowVersions.map((f) => f.flowId))];

  const { data: flows, isLoading } = useQuery({
    queryKey: ['failed-migration-flows', uniqueFlowIds],
    queryFn: () =>
      Promise.allSettled(uniqueFlowIds.map((id) => flowsApi.get(id))),
    enabled: open && uniqueFlowIds.length > 0,
  });

  const flowMap = new Map<string, PopulatedFlow>();
  if (flows) {
    flows.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        flowMap.set(uniqueFlowIds[index], result.value);
      }
    });
  }

  const grouped = groupByFlowId({ failedFlowVersions, flowMap });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('Failed Migrations')}</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <ScrollArea className="max-h-[400px]">
            <ul className="flex flex-col gap-3 pr-3">
              {grouped.map((group) => (
                <li
                  key={group.flowId}
                  className="flex items-start gap-3 rounded-md border p-3"
                >
                  <AlertTriangle className="size-4 shrink-0 text-destructive mt-0.5" />
                  <div className="flex flex-col gap-1 min-w-0">
                    <span className="text-sm font-medium truncate">
                      {group.flowDisplayName}
                    </span>
                    {group.versions.map((version) => (
                      <p
                        key={version.flowVersionId}
                        className="text-xs text-muted-foreground"
                      >
                        {version.error}
                      </p>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}

function groupByFlowId({
  failedFlowVersions,
  flowMap,
}: {
  failedFlowVersions: FailedFlowVersion[];
  flowMap: Map<string, PopulatedFlow>;
}): GroupedFailure[] {
  const groups = new Map<string, GroupedFailure>();

  for (const failure of failedFlowVersions) {
    const existing = groups.get(failure.flowId);
    if (existing) {
      existing.versions.push(failure);
    } else {
      const flow = flowMap.get(failure.flowId);
      groups.set(failure.flowId, {
        flowId: failure.flowId,
        flowDisplayName: flow
          ? flow.version.displayName
          : t('Deleted flow ({flowId})', { flowId: failure.flowId }),
        versions: [failure],
      });
    }
  }

  return [...groups.values()];
}

type FailedMigrationsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  failedFlowVersions: FailedFlowVersion[];
};
