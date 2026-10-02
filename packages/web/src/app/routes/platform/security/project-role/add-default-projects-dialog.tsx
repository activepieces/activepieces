import { ProjectWithLimits } from '@activepieces/shared';
import { t } from 'i18next';
import { Search } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { ConfirmationDeleteDialog } from '@/components/custom/delete-dialog';
import { TextWithTooltip } from '@/components/custom/text-with-tooltip';
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
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';

export function AddDefaultProjectsDialog({
  open,
  onOpenChange,
  teamProjects,
  defaultProjectIds,
  isSaving,
  requiresAProject,
  onSave,
}: AddDefaultProjectsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <AddDefaultProjectsContent
          key={open ? 'open' : 'closed'}
          teamProjects={teamProjects}
          defaultProjectIds={defaultProjectIds}
          isSaving={isSaving}
          requiresAProject={requiresAProject}
          onSave={onSave}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

function AddDefaultProjectsContent({
  teamProjects,
  defaultProjectIds,
  isSaving,
  requiresAProject,
  onSave,
  onCancel,
}: AddDefaultProjectsContentProps) {
  const [checkedIds, setCheckedIds] = useState<Set<string>>(
    () => new Set(defaultProjectIds),
  );
  const [search, setSearch] = useState('');
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const filteredProjects = teamProjects.filter((project) =>
    project.displayName.toLowerCase().includes(search.toLowerCase()),
  );
  const hasExistingDefaults = defaultProjectIds.length > 0;

  const toggleProject = (projectId: string) => {
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

  const selectedIds = teamProjects
    .map((project) => project.id)
    .filter((id) => checkedIds.has(id));
  const removedProjects = teamProjects.filter(
    (project) =>
      defaultProjectIds.includes(project.id) && !checkedIds.has(project.id),
  );
  const save = () => {
    if (removedProjects.length > 0) {
      setIsConfirmOpen(true);
      return;
    }
    onSave(selectedIds).catch(showSaveError);
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{t('Add default projects')}</DialogTitle>
        <DialogDescription>
          {t(
            'New members join the projects you pick. You can change them any time.',
          )}
        </DialogDescription>
      </DialogHeader>

      <div className="flex flex-col gap-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-8"
            placeholder={t('Search projects')}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <ScrollArea className="h-64">
          <div>
            {filteredProjects.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">
                {search.trim().length > 0
                  ? t('No projects match "{search}"', { search: search.trim() })
                  : t('No team projects yet. Create one on the Projects page.')}
              </p>
            )}
            {filteredProjects.map((project) => (
              <button
                key={project.id}
                type="button"
                className="flex w-full cursor-pointer items-center gap-3 rounded-md px-2 py-2 text-left hover:bg-accent"
                onClick={() => toggleProject(project.id)}
              >
                <Checkbox
                  checked={checkedIds.has(project.id)}
                  onCheckedChange={() => toggleProject(project.id)}
                  onClick={(event) => event.stopPropagation()}
                />
                <TextWithTooltip tooltipMessage={project.displayName}>
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">
                    {project.displayName}
                  </span>
                </TextWithTooltip>
                <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                  {t('projectMemberCount', {
                    count: project.analytics.totalUsers,
                  })}
                </span>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      <DialogFooter className="sm:justify-between">
        <span className="self-center text-sm text-muted-foreground">
          {requiresAProject && selectedIds.length === 0
            ? t(
                'Keep at least one default project while personal projects are off.',
              )
            : t('{count} selected', { count: selectedIds.length })}
        </span>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            {t('Cancel')}
          </Button>
          <Button
            type="button"
            loading={isSaving}
            disabled={
              selectedIds.length === 0 &&
              (!hasExistingDefaults || requiresAProject)
            }
            onClick={save}
          >
            {hasExistingDefaults
              ? t('Save')
              : t('addDefaultProjectsCount', { count: selectedIds.length })}
          </Button>
        </div>
      </DialogFooter>
      <ConfirmationDeleteDialog
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        title={t('removeDefaultProjectsTitle', {
          count: removedProjects.length,
        })}
        message={t('removeDefaultProjectsMessage', {
          count: removedProjects.length,
          projects: removedProjects
            .map((project) => project.displayName)
            .join(', '),
        })}
        entityName={t('Default projects')}
        buttonText={t('Remove')}
        mutationFn={() => onSave(selectedIds)}
        onError={showSaveError}
      />
    </>
  );
}

function showSaveError() {
  toast.error(t('Failed to save changes. Please try again.'));
}

type AddDefaultProjectsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamProjects: TeamProject[];
  defaultProjectIds: string[];
  isSaving: boolean;
  requiresAProject: boolean;
  onSave: (defaultProjectIds: string[]) => Promise<void>;
};

type AddDefaultProjectsContentProps = {
  teamProjects: TeamProject[];
  defaultProjectIds: string[];
  isSaving: boolean;
  requiresAProject: boolean;
  onSave: (defaultProjectIds: string[]) => Promise<void>;
  onCancel: () => void;
};

type TeamProject = Pick<ProjectWithLimits, 'id' | 'displayName' | 'analytics'>;
