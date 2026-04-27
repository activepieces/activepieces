import { PopulatedFlow } from '@activepieces/shared';
import { useQuery } from '@tanstack/react-query';
import { t } from 'i18next';
import { Loader2 } from 'lucide-react';
import { ReactNode, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { projectCollectionUtils } from '@/features/projects';

import {
  aiProviderMigrationKeys,
  migrationFlowFetchers,
} from '../hooks/ai-provider-migration-hooks';

export function ProjectGroupedFlowList<
  TEntry extends { flowId: string; projectId: string },
>({
  entries,
  renderRow,
}: {
  entries: TEntry[];
  renderRow: (args: {
    flowId: string;
    entries: TEntry[];
    displayName: string;
    projectId: string;
  }) => ReactNode;
}) {
  const { data: projects = [] } =
    projectCollectionUtils.useAllPlatformProjects();

  const projectGroups = useMemo(() => {
    const projectNameById = new Map(projects.map((p) => [p.id, p.displayName]));
    const grouped = groupBy(entries, (entry) => entry.projectId);
    return [...grouped.entries()].map(([projectId, groupEntries]) => ({
      projectId,
      projectName:
        projectNameById.get(projectId) ??
        t('Deleted project ({projectId})', { projectId }),
      entries: groupEntries,
    }));
  }, [entries, projects]);

  const [openValues, setOpenValues] = useState<string[]>([]);

  return (
    <ScrollArea className="max-h-[400px]">
      <Accordion
        type="multiple"
        value={openValues}
        onValueChange={setOpenValues}
        className="border-0 pr-3"
      >
        {projectGroups.map((group) => {
          const flowsInProject = groupByFlowId(group.entries);
          return (
            <AccordionItem
              key={group.projectId}
              value={group.projectId}
              className="border-b last:border-b-0"
            >
              <AccordionTrigger className="px-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="truncate font-semibold">
                    {group.projectName}
                  </span>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {t('{count, plural, =1 {1 flow} other {# flows}}', {
                      count: flowsInProject.length,
                    })}
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-2">
                <ProjectFlowsRows
                  projectId={group.projectId}
                  isOpen={openValues.includes(group.projectId)}
                  flows={flowsInProject}
                  renderRow={renderRow}
                />
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
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

function ProjectFlowsRows<
  TEntry extends { flowId: string; projectId: string },
>({
  projectId,
  isOpen,
  flows,
  renderRow,
}: {
  projectId: string;
  isOpen: boolean;
  flows: Array<{ flowId: string; entries: TEntry[] }>;
  renderRow: (args: {
    flowId: string;
    entries: TEntry[];
    displayName: string;
    projectId: string;
  }) => ReactNode;
}) {
  const { data: projectFlows, isLoading } = useQuery({
    queryKey: aiProviderMigrationKeys.projectFlows(projectId),
    queryFn: () => migrationFlowFetchers.fetchAllFlowsForProject(projectId),
    enabled: isOpen,
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const flowsById = new Map<string, PopulatedFlow>();
  for (const flow of projectFlows ?? []) {
    flowsById.set(flow.id, flow);
  }

  return (
    <ul className="flex flex-col gap-2">
      {flows.map(({ flowId, entries }) => {
        const populated = flowsById.get(flowId);
        const displayName =
          populated?.version.displayName ??
          t('Deleted flow ({flowId})', { flowId });
        return renderRow({ flowId, entries, displayName, projectId });
      })}
    </ul>
  );
}

function groupByFlowId<T extends { flowId: string }>(
  entries: T[],
): Array<{ flowId: string; entries: T[] }> {
  return [...groupBy(entries, (e) => e.flowId).entries()].map(
    ([flowId, groupEntries]) => ({ flowId, entries: groupEntries }),
  );
}

function groupBy<T, K>(items: T[], keyFn: (item: T) => K): Map<K, T[]> {
  const map = new Map<K, T[]>();
  for (const item of items) {
    const key = keyFn(item);
    const existing = map.get(key);
    if (existing) {
      existing.push(item);
    } else {
      map.set(key, [item]);
    }
  }
  return map;
}
