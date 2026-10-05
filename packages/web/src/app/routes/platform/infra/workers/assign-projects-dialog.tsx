import { ProjectWithLimits } from '@activepieces/shared';
import { t } from 'i18next';
import { useState } from 'react';

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
import { AdminControl, adminControl } from '@/lib/admin-control';
import { mutationFeedback } from '@/lib/mutation-feedback';

import { workerGroupUtils } from './machine-card';
import { ProjectAvatar } from './project-avatar';
import {
  GroupAssignment,
  useAssignProjectsToGroup,
} from './worker-settings-mutations';

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
  const [error, setError] = useState<string | null>(null);
  const assignProjects = useAssignProjectsToGroup();
  const groupName = workerGroupUtils.displayName(groupLabel);
  const query = search.trim().toLowerCase();
  const visible = allProjects.filter((project) =>
    project.displayName.toLowerCase().includes(query),
  );
  const changes = pendingChanges({ allProjects, checkedIds, groupLabel });

  const toggle = (projectId: string) => {
    setError(null);
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
    if (saving || changes.length === 0) {
      return;
    }
    setSaving(true);
    setError(null);
    const { failed } = await assignProjects({ changes });
    setSaving(false);
    if (failed.length === 0) {
      onOpenChange(false);
      return;
    }
    setError(
      failed.length === changes.length
        ? mutationFeedback.message(failed[0])
        : t(
            "{failed, plural, =1 {1 project} other {# projects}} couldn't be moved. The rest were saved. Try again.",
            { failed: failed.length },
          ),
    );
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
        {error ? (
          <span role="alert" className="text-sm text-danger-11">
            {error}
          </span>
        ) : (
          <span className="text-sm text-gray-11 tabular-nums">
            {t('{count, plural, =1 {# project} other {# projects}}', {
              count: checkedIds.size,
            })}
          </span>
        )}
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={saving}
            onClick={() => onOpenChange(false)}
          >
            {t('Cancel')}
          </Button>
          <Button
            {...adminControl(AdminControl.WORKERS_ASSIGN_SUBMIT)}
            type="button"
            loading={saving}
            disabled={changes.length === 0}
            onClick={handleSave}
          >
            {t('Save')}
          </Button>
        </div>
      </DialogFooter>
    </>
  );
}

function pendingChanges({
  allProjects,
  checkedIds,
  groupLabel,
}: {
  allProjects: ProjectWithLimits[];
  checkedIds: Set<string>;
  groupLabel: string;
}): GroupAssignment[] {
  return allProjects.flatMap((project) => {
    const previous = project.workerGroupId ?? null;
    const wasIn = previous === groupLabel;
    const isIn = checkedIds.has(project.id);
    if (isIn === wasIn) {
      return [];
    }
    return [
      { projectId: project.id, next: isIn ? groupLabel : null, previous },
    ];
  });
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
