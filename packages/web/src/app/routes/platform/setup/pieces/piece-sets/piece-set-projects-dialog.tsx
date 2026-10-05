import {
  isNil,
  PieceSet,
  ProjectWithLimits,
  tryCatch,
} from '@activepieces/shared';
import { t } from 'i18next';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { ProjectAvatar } from '@/app/routes/platform/infra/workers/project-avatar';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { pieceSetMutations } from '@/features/piece-sets';
import { projectHooks } from '@/features/projects';

type PieceSetProjectsDialogProps = {
  pieceSet: PieceSet;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const isAssignedToSet = ({
  pieceSet,
  project,
}: {
  pieceSet: PieceSet;
  project: ProjectWithLimits;
}) => {
  if (pieceSet.isDefault) {
    return project.pieceSetId === pieceSet.id || isNil(project.pieceSetId);
  }
  return project.pieceSetId === pieceSet.id;
};

const AssignProjectsForm = ({
  pieceSet,
  allProjects,
  serverAssignedIds,
  onOpenChange,
}: {
  pieceSet: PieceSet;
  allProjects: ProjectWithLimits[];
  serverAssignedIds: string[];
  onOpenChange: (open: boolean) => void;
}) => {
  const [selected, setSelected] = useState<string[]>(serverAssignedIds);
  const assignMutation = pieceSetMutations.useAssignProjects();
  const removeMutation = pieceSetMutations.useBulkRemoveProjects();

  const isSaving = assignMutation.isPending || removeMutation.isPending;

  const toggleProject = (projectId: string) => {
    setSelected((prev) =>
      prev.includes(projectId)
        ? prev.filter((id) => id !== projectId)
        : [...prev, projectId],
    );
  };

  const handleSave = async () => {
    const serverSet = new Set(serverAssignedIds);
    const draftSet = new Set(selected);
    const added = selected.filter((id) => !serverSet.has(id));
    const removed = pieceSet.isDefault
      ? []
      : serverAssignedIds.filter((id) => !draftSet.has(id));

    if (added.length === 0 && removed.length === 0) {
      onOpenChange(false);
      return;
    }

    const promises: Promise<unknown>[] = [];
    if (added.length > 0) {
      promises.push(
        assignMutation.mutateAsync({ id: pieceSet.id, projectIds: added }),
      );
    }
    if (removed.length > 0) {
      promises.push(
        removeMutation.mutateAsync({ id: pieceSet.id, projectIds: removed }),
      );
    }

    const { error } = await tryCatch(() => Promise.all(promises));
    if (error) {
      toast.error(t('Could not save the changes. Try again.'));
      return;
    }
    onOpenChange(false);
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{t('Assign projects')}</DialogTitle>
        <DialogDescription>
          {pieceSet.isDefault
            ? t(
                'Projects without a policy already use the Default policy. Pick projects to move back to it.',
              )
            : t('Choose which projects build with {name}.', {
                name: pieceSet.name,
              })}
        </DialogDescription>
      </DialogHeader>
      <Command className="rounded-xl border">
        <CommandInput placeholder={t('Search projects')} />
        <CommandList className="max-h-72 overflow-y-auto">
          <CommandEmpty>{t('No projects found')}</CommandEmpty>
          <CommandGroup>
            {allProjects.map((project) => {
              const checked = selected.includes(project.id);
              const locked =
                pieceSet.isDefault && isAssignedToSet({ pieceSet, project });
              return (
                <CommandItem
                  key={project.id}
                  value={project.id}
                  keywords={[project.displayName]}
                  disabled={locked}
                  onSelect={() => toggleProject(project.id)}
                >
                  <Checkbox checked={checked} className="pointer-events-none" />
                  <ProjectAvatar project={project} size="sm" />
                  <span className="truncate">{project.displayName}</span>
                </CommandItem>
              );
            })}
          </CommandGroup>
        </CommandList>
      </Command>
      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(false)}
        >
          {t('Cancel')}
        </Button>
        <Button type="button" loading={isSaving} onClick={handleSave}>
          {t('Save')}
        </Button>
      </DialogFooter>
    </>
  );
};

export const usePieceSetProjects = (pieceSet: PieceSet) => {
  const { data: platformsData, isLoading } =
    projectHooks.useProjectsForPlatforms();
  const allProjects = useMemo<ProjectWithLimits[]>(
    () => platformsData?.flatMap((p) => p.projects) ?? [],
    [platformsData],
  );
  const assignedProjects = useMemo(
    () =>
      allProjects.filter((project) => isAssignedToSet({ pieceSet, project })),
    [allProjects, pieceSet],
  );
  return { allProjects, assignedProjects, isLoading };
};

export const PieceSetProjectsDialog = ({
  pieceSet,
  open,
  onOpenChange,
}: PieceSetProjectsDialogProps) => {
  const { allProjects, assignedProjects } = usePieceSetProjects(pieceSet);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <AssignProjectsForm
          key={open ? 'open' : 'closed'}
          pieceSet={pieceSet}
          allProjects={allProjects}
          serverAssignedIds={assignedProjects.map((project) => project.id)}
          onOpenChange={onOpenChange}
        />
      </DialogContent>
    </Dialog>
  );
};
