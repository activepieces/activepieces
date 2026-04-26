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
  fetchAllFlowsForProject,
  migrationProjectFlowsQueryKey,
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
    const projectNameById = new Map<string, string>();
    for (const project of projects) {
      projectNameById.set(project.id, project.displayName);
    }
    const groupsByProject = new Map<
      string,
      { projectId: string; projectName: string; entries: TEntry[] }
    >();
    for (const entry of entries) {
      const existing = groupsByProject.get(entry.projectId);
      if (existing) {
        existing.entries.push(entry);
        continue;
      }
      groupsByProject.set(entry.projectId, {
        projectId: entry.projectId,
        projectName:
          projectNameById.get(entry.projectId) ??
          t('Deleted project ({projectId})', { projectId: entry.projectId }),
        entries: [entry],
      });
    }
    return [...groupsByProject.values()];
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
                    {t(
                      '{count, plural, =1 {1 flow} other {# flows}}',
                      { count: flowsInProject.length },
                    )}
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
    queryKey: migrationProjectFlowsQueryKey(projectId),
    queryFn: () => fetchAllFlowsForProject(projectId),
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
