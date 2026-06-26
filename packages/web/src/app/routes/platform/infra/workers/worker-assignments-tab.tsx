import {
  UpdateProjectPlatformRequest,
  ProjectWithLimits,
} from '@activepieces/shared';
import { t } from 'i18next';
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
import { projectCollectionUtils } from '@/features/projects/stores/project-collection';
import { platformHooks } from '@/hooks/platform-hooks';

const SHARED_SENTINEL = '__shared__';

export function WorkerAssignmentsTab() {
  const { platform } = platformHooks.useCurrentPlatform();
  const { data: projects } = projectCollectionUtils.useAllPlatformProjects();
  const { data: workerTags } = workersQueries.useWorkerTags(
    platform.plan.isolatedWorkersEnabled,
  );

  return (
    <div className="flex flex-col gap-4 pt-4">
      <p className="text-sm text-muted-foreground">
        {t(
          'Assigning a project to a worker routes its flow and webhook runs to that worker pool. The concurrency limit caps how many jobs run simultaneously.',
        )}
      </p>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('Project')}</TableHead>
            <TableHead>{t('Assigned Worker')}</TableHead>
            <TableHead>{t('Concurrency Limit')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.map((project) => (
            <ProjectAssignmentRow
              key={project.id}
              project={project}
              workerTags={workerTags ?? []}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function ProjectAssignmentRow({
  project,
  workerTags,
}: {
  project: ProjectWithLimits;
  workerTags: string[];
}) {
  const [concurrencyInput, setConcurrencyInput] = useState(
    project.maxConcurrentJobs != null ? String(project.maxConcurrentJobs) : '',
  );

  const saveUpdate = (update: UpdateProjectPlatformRequest) => {
    projectCollectionUtils.update(project.id, update);
  };

  const handleWorkerTagChange = (value: string) => {
    const tag = value === SHARED_SENTINEL ? null : value;
    saveUpdate({ workerTag: tag });
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

  const selectValue = project.workerTag ?? SHARED_SENTINEL;

  return (
    <TableRow>
      <TableCell className="min-w-0 max-w-[200px]">
        <TextWithTooltip tooltipMessage={project.displayName}>
          <p className="text-sm font-medium">{project.displayName}</p>
        </TextWithTooltip>
      </TableCell>
      <TableCell>
        <Select value={selectValue} onValueChange={handleWorkerTagChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={SHARED_SENTINEL}>
              {t('Shared (none)')}
            </SelectItem>
            {workerTags.map((tag) => (
              <SelectItem key={tag} value={tag}>
                {tag.replaceAll('_', ' ')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell>
        <Input
          type="text"
          inputMode="numeric"
          className="w-[120px]"
          placeholder={t('Unlimited')}
          value={concurrencyInput}
          onChange={(e) => setConcurrencyInput(e.target.value)}
          onBlur={commitConcurrency}
          onKeyDown={handleConcurrencyKeyDown}
        />
      </TableCell>
    </TableRow>
  );
}
