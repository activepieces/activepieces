import { t } from 'i18next';
import { Loader2 } from 'lucide-react';
import { ReactNode } from 'react';
import { Link } from 'react-router-dom';

import { ScrollArea } from '@/components/ui/scroll-area';

import { MigrationFlowProjectGroup } from '../hooks/ai-provider-migration-hooks';

export function ProjectGroupedFlowList<
  TEntry extends { flowId: string; projectId: string },
>({
  entries,
  groups,
  isLoading,
  renderRow,
}: {
  entries: TEntry[];
  groups: MigrationFlowProjectGroup[];
  isLoading: boolean;
  renderRow: (args: {
    flowId: string;
    entries: TEntry[];
    displayName: string;
    projectId: string;
  }) => ReactNode;
}) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <ScrollArea className="max-h-[400px]">
      <div className="flex flex-col gap-4 pr-3">
        {groups.map((group) => {
          const versionsInProject = entries.filter(
            (e) => e.projectId === group.projectId,
          );
          const byFlow = groupByFlowId(versionsInProject);
          return (
            <div key={group.projectId} className="flex flex-col gap-2">
              <h4 className="text-sm font-semibold text-muted-foreground">
                {group.projectName}
              </h4>
              <ul className="flex flex-col gap-2">
                {byFlow.map(({ flowId, entries: flowEntries }) => {
                  const populated = group.flowsById.get(flowId);
                  const displayName =
                    populated?.version.displayName ??
                    t('Deleted flow ({flowId})', { flowId });
                  return renderRow({
                    flowId,
                    entries: flowEntries,
                    displayName,
                    projectId: group.projectId,
                  });
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}

export function FlowLink({
  projectId,
  flowId,
  displayName,
}: {
  projectId: string;
  flowId: string;
  displayName: string;
}) {
  return (
    <Link
      to={`/projects/${projectId}/flows/${flowId}`}
      target="_blank"
      rel="noreferrer"
      className="text-sm font-medium truncate hover:underline"
    >
      {displayName}
    </Link>
  );
}

function groupByFlowId<T extends { flowId: string }>(
  entries: T[],
): Array<{ flowId: string; entries: T[] }> {
  const map = new Map<string, T[]>();
  for (const entry of entries) {
    const existing = map.get(entry.flowId);
    if (existing) {
      existing.push(entry);
    } else {
      map.set(entry.flowId, [entry]);
    }
  }
  return [...map.entries()].map(([flowId, entries]) => ({ flowId, entries }));
}
