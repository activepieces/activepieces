import {
  isNil,
  PieceSet,
  PROJECT_COLOR_PALETTE,
  ProjectWithLimits,
  tryCatch,
} from '@activepieces/shared';
import { t } from 'i18next';
import { ChevronDown } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

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
  DialogTrigger,
} from '@/components/ui/dialog';
import { pieceSetMutations } from '@/features/piece-sets';
import { projectHooks } from '@/features/projects';

type PieceSetProjectsDialogProps = {
  pieceSet: PieceSet;
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
      toast.error(t('Failed to save changes. Please try again.'));
      return;
    }
    onOpenChange(false);
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{t('Assigned projects')}</DialogTitle>
        <DialogDescription>
          {t('Choose which projects use this piece set.')}
        </DialogDescription>
      </DialogHeader>
      <Command className="rounded-md border">
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

export const PieceSetProjectsDialog = ({
  pieceSet,
}: PieceSetProjectsDialogProps) => {
  const [open, setOpen] = useState(false);
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

  const serverAssignedIds = useMemo(
    () => assignedProjects.map((project) => project.id),
    [assignedProjects],
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          disabled={isLoading}
          className="h-9 gap-2 rounded-lg pl-2.5 pr-2 font-normal"
        >
          {assignedProjects.length === 0 ? (
            <span className="text-muted-foreground">
              {t('No projects assigned')}
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <span className="flex items-center gap-0.5">
                {assignedProjects.slice(0, 3).map((project) => (
                  <span
                    key={project.id}
                    className="flex size-5 items-center justify-center rounded-[5px] text-[9px] font-bold"
                    style={{
                      backgroundColor:
                        PROJECT_COLOR_PALETTE[project.icon.color].color,
                      color:
                        PROJECT_COLOR_PALETTE[project.icon.color].textColor,
                    }}
                  >
                    {project.displayName.charAt(0).toUpperCase()}
                  </span>
                ))}
              </span>
              <span className="text-sm font-medium">
                {t('projectsAssignedCount', {
                  count: assignedProjects.length,
                })}
              </span>
            </span>
          )}
          <ChevronDown className="size-3.5 text-muted-foreground shrink-0" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <AssignProjectsForm
          key={open ? 'open' : 'closed'}
          pieceSet={pieceSet}
          allProjects={allProjects}
          serverAssignedIds={serverAssignedIds}
          onOpenChange={setOpen}
        />
      </DialogContent>
    </Dialog>
  );
};
