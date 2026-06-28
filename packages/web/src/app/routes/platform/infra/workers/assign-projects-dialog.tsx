import { ProjectWithLimits } from '@activepieces/shared';
import { t } from 'i18next';
import { Layers, Search } from 'lucide-react';
import { useState } from 'react';

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
import { projectCollectionUtils } from '@/features/projects/stores/project-collection';
import { cn } from '@/lib/utils';

import { ProjectAvatar } from './project-avatar';

export function AssignProjectsDialog({
  open,
  onOpenChange,
  groupLabel,
  allProjects,
}: AssignProjectsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
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
          .filter((p) => p.workerGroupId === groupLabel)
          .map((p) => p.id),
      ),
  );
  const [search, setSearch] = useState('');

  const filteredProjects = allProjects.filter((p) =>
    p.displayName.toLowerCase().includes(search.toLowerCase()),
  );

  const toggleProject = (projectId: string) => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(projectId)) {
        next.delete(projectId);
      } else {
        next.add(projectId);
      }
      return next;
    });
  };

  const handleSave = () => {
    for (const project of allProjects) {
      const wasInGroup = project.workerGroupId === groupLabel;
      const isNowChecked = checkedIds.has(project.id);

      if (isNowChecked && !wasInGroup) {
        projectCollectionUtils.update(project.id, {
          workerGroupId: groupLabel,
        });
      } else if (!isNowChecked && wasInGroup) {
        projectCollectionUtils.update(project.id, { workerGroupId: null });
      }
    }
    onOpenChange(false);
  };

  const getSubtitle = (project: ProjectWithLimits): string => {
    if (project.workerGroupId === groupLabel) {
      return t('in this group');
    }
    if (project.workerGroupId) {
      return t('currently in {group} — will move here', {
        group: project.workerGroupId.replaceAll('_', ' '),
      });
    }
    return t('shared queue');
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{t('Assign projects')}</DialogTitle>
        <DialogDescription>
          {t("These projects will run on this group's dedicated queue.")}
        </DialogDescription>
        <div className="inline-flex items-center gap-1.5 rounded-md bg-primary/10 px-2 py-1 text-sm font-medium text-primary w-fit">
          <Layers className="size-3.5 shrink-0" />
          {groupLabel.replaceAll('_', ' ')}
        </div>
      </DialogHeader>

      <div className="flex flex-col gap-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-8"
            placeholder={t('Search projects')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <ScrollArea className="h-64 rounded-md border">
          <div className="p-1">
            {filteredProjects.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">
                {t('No projects')}
              </p>
            )}
            {filteredProjects.map((project) => {
              const isChecked = checkedIds.has(project.id);
              const subtitle = getSubtitle(project);
              const isCurrentGroup = project.workerGroupId === groupLabel;

              return (
                <button
                  key={project.id}
                  type="button"
                  className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left hover:bg-accent cursor-pointer"
                  onClick={() => toggleProject(project.id)}
                >
                  <Checkbox
                    checked={isChecked}
                    onCheckedChange={() => toggleProject(project.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <ProjectAvatar project={project} />
                  <div className="flex min-w-0 flex-col">
                    <TextWithTooltip tooltipMessage={project.displayName}>
                      <span className="text-sm font-medium truncate">
                        {project.displayName}
                      </span>
                    </TextWithTooltip>
                    <span
                      className={cn('text-xs text-muted-foreground truncate', {
                        'text-primary': isCurrentGroup,
                      })}
                    >
                      {subtitle}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      <DialogFooter className="sm:justify-between">
        <span className="text-sm text-muted-foreground self-center">
          {checkedIds.size}{' '}
          {checkedIds.size === 1 ? t('Project') : t('Projects')}
        </span>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {t('Cancel')}
          </Button>
          <Button type="button" onClick={handleSave}>
            {t('Save')}
          </Button>
        </div>
      </DialogFooter>
    </>
  );
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
