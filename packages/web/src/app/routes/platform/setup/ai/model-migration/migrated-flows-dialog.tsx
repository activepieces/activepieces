import { FlowMigration, PopulatedFlow } from '@activepieces/shared';
import { useQuery } from '@tanstack/react-query';
import { t } from 'i18next';
import { CheckCircle2, Loader2 } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { flowsApi } from '@/features/flows';

type MigratedVersion = FlowMigration['migratedVersions'][number];

function MigratedFlowsDialogContent({
  migratedVersions,
}: {
  migratedVersions: MigratedVersion[];
}) {
  const uniqueFlowIds = [...new Set(migratedVersions.map((v) => v.flowId))];

  const { data: flows, isLoading } = useQuery({
    queryKey: ['migrated-flows', uniqueFlowIds],
    queryFn: () =>
      Promise.allSettled(uniqueFlowIds.map((id) => flowsApi.get(id))),
    enabled: uniqueFlowIds.length > 0,
  });

  const flowMap = new Map<string, PopulatedFlow>();
  if (flows) {
    flows.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        flowMap.set(uniqueFlowIds[index], result.value);
      }
    });
  }

  const grouped = groupByFlowId({ migratedVersions, flowMap });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <ScrollArea className="max-h-[400px]">
      <ul className="flex flex-col gap-3 pr-3">
        {grouped.map((group) => (
          <li
            key={group.flowId}
            className="flex items-start gap-3 rounded-md border p-3"
          >
            <CheckCircle2 className="size-4 shrink-0 text-success mt-0.5" />
            <div className="flex flex-col gap-1 min-w-0">
              <span className="text-sm font-medium truncate">
                {group.flowDisplayName}
              </span>
              <p className="text-xs text-muted-foreground">
                {formatMigrationMessage(group.versionCount)}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </ScrollArea>
  );
}

export function MigratedFlowsDialog({
  open,
  onOpenChange,
  migratedVersions,
}: MigratedFlowsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('Migrated Flows')}</DialogTitle>
        </DialogHeader>
        {open && (
          <MigratedFlowsDialogContent migratedVersions={migratedVersions} />
        )}
      </DialogContent>
    </Dialog>
  );
}

function groupByFlowId({
  migratedVersions,
  flowMap,
}: {
  migratedVersions: MigratedVersion[];
  flowMap: Map<string, PopulatedFlow>;
}): GroupedMigration[] {
  const groups = new Map<string, GroupedMigration>();

  for (const version of migratedVersions) {
    const existing = groups.get(version.flowId);
    if (existing) {
      existing.versionCount++;
    } else {
      const flow = flowMap.get(version.flowId);
      groups.set(version.flowId, {
        flowId: version.flowId,
        flowDisplayName: flow
          ? flow.version.displayName
          : t('Deleted flow ({flowId})', { flowId: version.flowId }),
        versionCount: 1,
      });
    }
  }

  return [...groups.values()];
}

function formatMigrationMessage(versionCount: number): string {
  if (versionCount >= 2) {
    return t('Both draft and published versions were migrated.');
  }
  return t('1 version migrated.');
}

type GroupedMigration = {
  flowId: string;
  flowDisplayName: string;
  versionCount: number;
};

type MigratedFlowsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  migratedVersions: MigratedVersion[];
};
