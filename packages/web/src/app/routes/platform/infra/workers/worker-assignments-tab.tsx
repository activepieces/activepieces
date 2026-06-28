import {
  PROJECT_COLOR_PALETTE,
  ProjectType,
  ProjectWithLimits,
  UpdateProjectPlatformRequest,
} from '@activepieces/shared';
import { t } from 'i18next';
import { Cpu, Server } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { TextWithTooltip } from '@/components/custom/text-with-tooltip';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { workersQueries } from '@/features/platform-admin';
import { WorkerGroupInfo } from '@/features/platform-admin/api/workers-api';
import { projectCollectionUtils } from '@/features/projects/stores/project-collection';
import { platformHooks } from '@/hooks/platform-hooks';
import { cn } from '@/lib/utils';

const SHARED_SENTINEL = '__shared__';

export function WorkerAssignmentsTab() {
  const { platform } = platformHooks.useCurrentPlatform();
  const { data: projects } = projectCollectionUtils.useAllPlatformProjects();
  const { data: capacity } = workersQueries.useWorkerGroups(
    platform.plan.isolatedWorkersEnabled,
  );
  const workerGroups = capacity?.groups ?? [];
  const sharedSlots = capacity?.sharedSlots ?? 0;

  return (
    <div className="flex flex-col gap-4 pt-4">
      <p className="text-sm text-muted-foreground max-w-2xl">
        {t(
          'Assign a project to a worker to route its flow and webhook runs to that pool. Set a concurrency limit to cap how many of its runs execute at once.',
        )}
      </p>

      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>{t('Project')}</TableHead>
              <TableHead className="w-[240px]">
                {t('Assigned worker')}
              </TableHead>
              <TableHead className="w-[200px]">
                {t('Concurrency limit')}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.length === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={3}>
                  <div className="flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground">
                    <Server className="size-8" strokeWidth={1.5} />
                    <p className="text-sm">{t('No projects yet')}</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
            {projects.map((project) => (
              <ProjectAssignmentRow
                key={project.id}
                project={project}
                workerGroups={workerGroups}
                sharedSlots={sharedSlots}
              />
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function ProjectDot({ project }: { project: ProjectWithLimits }) {
  const isPersonal = project.type === ProjectType.PERSONAL;
  const palette = PROJECT_COLOR_PALETTE[project.icon.color];
  const background = isPersonal ? '#9ca3af' : palette.color;
  const color = isPersonal ? '#ffffff' : palette.textColor;

  return (
    <div
      className="flex size-7 shrink-0 items-center justify-center rounded-md text-xs font-semibold"
      style={{ backgroundColor: background, color }}
    >
      {project.displayName.charAt(0).toUpperCase()}
    </div>
  );
}

function ProjectAssignmentRow({
  project,
  workerGroups,
  sharedSlots,
}: {
  project: ProjectWithLimits;
  workerGroups: WorkerGroupInfo[];
  sharedSlots: number;
}) {
  const [concurrencyInput, setConcurrencyInput] = useState(
    project.maxConcurrentJobs != null ? String(project.maxConcurrentJobs) : '',
  );

  const assignedGroup = workerGroups.find(
    (info) => info.label === project.workerGroupId,
  );
  const poolSlots = assignedGroup ? assignedGroup.slots : sharedSlots;
  const concurrencyPlaceholder = t('Default {count}', { count: poolSlots });

  const saveUpdate = (update: UpdateProjectPlatformRequest) => {
    projectCollectionUtils.update(project.id, update);
  };

  const handleWorkerGroupChange = (value: string) => {
    const workerGroupId = value === SHARED_SENTINEL ? null : value;
    saveUpdate({ workerGroupId });
  };

  const commitConcurrency = () => {
    const parsed =
      concurrencyInput.trim() === '' ? null : parseInt(concurrencyInput, 10);
    if (parsed !== null && (isNaN(parsed) || parsed <= 0)) {
      toast.error(t('Concurrency limit must be a positive number'));
      setConcurrencyInput(
        project.maxConcurrentJobs != null
          ? String(project.maxConcurrentJobs)
          : '',
      );
      return;
    }
    saveUpdate({ maxConcurrentJobs: parsed });
  };

  const handleConcurrencyKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    }
  };

  const selectValue = project.workerGroupId ?? SHARED_SENTINEL;
  const isShared = selectValue === SHARED_SENTINEL;

  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-2.5 min-w-0">
          <ProjectDot project={project} />
          <TextWithTooltip tooltipMessage={project.displayName}>
            <p className="text-sm font-medium truncate">
              {project.displayName}
            </p>
          </TextWithTooltip>
        </div>
      </TableCell>
      <TableCell>
        <Select value={selectValue} onValueChange={handleWorkerGroupChange}>
          <SelectTrigger className="w-[200px]">
            <div className="flex items-center gap-2 min-w-0">
              <Cpu
                className={cn(
                  'size-3.5 shrink-0',
                  isShared ? 'text-muted-foreground' : 'text-primary',
                )}
              />
              <SelectValue />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={SHARED_SENTINEL}>
              <span className="text-muted-foreground">{t('Shared')}</span>
            </SelectItem>
            {workerGroups.map((info) => (
              <SelectItem key={info.label} value={info.label}>
                {info.label.replaceAll('_', ' ')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell>
        <Input
          type="text"
          inputMode="numeric"
          className="w-[150px]"
          placeholder={concurrencyPlaceholder}
          value={concurrencyInput}
          onChange={(e) =>
            setConcurrencyInput(e.target.value.replace(/[^0-9]/g, ''))
          }
          onBlur={commitConcurrency}
          onKeyDown={handleConcurrencyKeyDown}
        />
      </TableCell>
    </TableRow>
  );
}
