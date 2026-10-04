import { ProjectWithLimits } from '@activepieces/shared';
import { useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { useState } from 'react';
import { toast } from 'sonner';

import { refreshPlatformProjects } from '@/app/routes/platform/projects/use-platform-projects';
import { NameCell } from '@/components/custom/list/list-cells';
import { SearchInput } from '@/components/custom/search-input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { projectCollectionUtils } from '@/features/projects/stores/project-collection';

import { workerGroupUtils } from './machine-card';
import { ProjectAvatar } from './project-avatar';

export function AssignProjectsDialog({
  open,
  onOpenChange,
  groupLabel,
  allProjects,
}: AssignProjectsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <AssignProjectsContent
          key={open ? `open-${groupLabel}` : 'closed'}
          groupLabel={groupLabel}
          allProjects={allProjects}
          onOpenChange={onOpenChange}
        />
      </DialogContent>
    </Dialog>
  );
}

function AssignProjectsContent({
  groupLabel,
  allProjects,
  onOpenChange,
}: AssignProjectsContentProps) {
  const queryClient = useQueryClient();
  const [checkedIds, setCheckedIds] = useState<Set<string>>(
    () =>
      new Set(
        allProjects
          .filter((project) => project.workerGroupId === groupLabel)
          .map((project) => project.id),
      ),
  );
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const updateProject = projectCollectionUtils.useUpdateProject(
    () => undefined,
    () => undefined,
  );
  const groupName = workerGroupUtils.displayName(groupLabel);
  const query = search.trim().toLowerCase();
  const visible = allProjects.filter((project) =>
    project.displayName.toLowerCase().includes(query),
  );

  const toggle = (projectId: string) => {
    setCheckedIds((previous) => {
      const next = new Set(previous);
      if (next.has(projectId)) {
        next.delete(projectId);
      } else {
        next.add(projectId);
      }
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    const changes = allProjects.flatMap((project) => {
      const wasIn = project.workerGroupId === groupLabel;
      const isIn = checkedIds.has(project.id);
      if (isIn === wasIn) {
        return [];
      }
      return [
        { projectId: project.id, workerGroupId: isIn ? groupLabel : null },
      ];
    });
    try {
      for (const change of changes) {
        await updateProject.mutateAsync({
          projectId: change.projectId,
          request: { workerGroupId: change.workerGroupId },
        });
      }
      await refreshPlatformProjects(queryClient);
      onOpenChange(false);
    } catch {
      toast.error(t('Could not save the change. Try again.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{t('Assign projects')}</DialogTitle>
        <DialogDescription>
          {t("Checked projects run only on {group}'s machines.", {
            group: groupName,
          })}
        </DialogDescription>
      </DialogHeader>
      <div className="flex flex-col gap-3">
        <SearchInput
          value={search}
          placeholder={t('Search projects')}
          onChange={setSearch}
        />
        <ScrollArea className="h-72 rounded-xl border border-gray-6">
          <div className="flex flex-col p-1">
            {visible.length === 0 && (
              <p className="px-3 py-8 text-sm text-gray-11">
                {t('No project matches')}
              </p>
            )}
            {visible.map((project) => (
              <label
                key={project.id}
                className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 hover:bg-gray-3"
              >
                <Checkbox
                  checked={checkedIds.has(project.id)}
                  onCheckedChange={() => toggle(project.id)}
                />
                <NameCell
                  stacked
                  media={<ProjectAvatar project={project} size="sm" />}
                  title={project.displayName}
                  sub={placeOf({ project, groupLabel })}
                />
              </label>
            ))}
          </div>
        </ScrollArea>
      </div>
      <DialogFooter className="items-center sm:justify-between">
        <span className="text-sm text-gray-11 tabular-nums">
          {t('{count, plural, =1 {# project} other {# projects}}', {
            count: checkedIds.size,
          })}
        </span>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {t('Cancel')}
          </Button>
          <Button type="button" loading={saving} onClick={handleSave}>
            {t('Save')}
          </Button>
        </div>
      </DialogFooter>
    </>
  );
}

function placeOf({
  project,
  groupLabel,
}: {
  project: ProjectWithLimits;
  groupLabel: string;
}): string {
  if (project.workerGroupId === groupLabel) {
    return t('In this group');
  }
  if (project.workerGroupId) {
    return t('In {group}', {
      group: workerGroupUtils.displayName(project.workerGroupId),
    });
  }
  return t('Shared pool');
}

type AssignProjectsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupLabel: string;
  allProjects: ProjectWithLimits[];
};

type AssignProjectsContentProps = {
  groupLabel: string;
  allProjects: ProjectWithLimits[];
  onOpenChange: (open: boolean) => void;
};
