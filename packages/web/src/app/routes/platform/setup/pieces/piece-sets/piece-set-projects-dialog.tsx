import { isNil, PieceSet, ProjectWithLimits } from '@activepieces/shared';
import { useIsMutating, useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { useMemo, useState } from 'react';

import { AdminFetchErrorState, adminLayout } from '@/app/components/admin';
import { ProjectAvatar } from '@/app/routes/platform/infra/workers/project-avatar';
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { VirtualizedScrollArea } from '@/components/ui/virtualized-scroll-area';
import {
  pieceSetQueries,
  pieceSetTerms,
  projectPieceSet,
  usePieceSetProjectMoves,
} from '@/features/piece-sets';
import { projectHooks } from '@/features/projects';
import { platformHooks } from '@/hooks/platform-hooks';
import { AdminControl, adminControl } from '@/lib/admin-control';
import { listUtils } from '@/lib/list-utils';
import { mutationFeedback } from '@/lib/mutation-feedback';

import { SkeletonRows } from './policy-ui';

export const usePieceSetProjects = (pieceSet: PieceSet) => {
  const { platform } = platformHooks.useCurrentPlatform();
  const {
    data: platformsData,
    isLoading,
    isError,
    refetch,
  } = projectHooks.useProjectsForPlatforms();
  const allProjects = useMemo<ProjectWithLimits[]>(
    () =>
      (platformsData ?? [])
        .flatMap((entry) => entry.projects)
        .filter((project) => project.platformId === platform.id),
    [platformsData, platform.id],
  );
  const assignedProjects = useMemo(
    () =>
      allProjects.filter((project) =>
        projectPieceSet.isAssignedToSet({ pieceSet, project }),
      ),
    [allProjects, pieceSet],
  );
  return { allProjects, assignedProjects, isLoading, isError, refetch };
};

export const PieceSetProjectsDialog = ({
  pieceSet,
  open,
  onOpenChange,
}: PieceSetProjectsDialogProps) => {
  const { allProjects, assignedProjects, isLoading, isError, refetch } =
    usePieceSetProjects(pieceSet);
  const saving = useIsMutating({ mutationKey: saveKey(pieceSet.id) }) > 0;
  const body = (() => {
    if (isError) {
      return (
        <>
          <DialogHeader>
            <DialogTitle>{t('Assign projects')}</DialogTitle>
          </DialogHeader>
          <AdminFetchErrorState entity={t('projects')} onRetry={refetch} />
        </>
      );
    }
    if (isLoading) {
      return (
        <>
          <DialogHeader>
            <DialogTitle>{t('Assign projects')}</DialogTitle>
          </DialogHeader>
          <SkeletonRows count={5} className="h-9 rounded-lg" />
        </>
      );
    }
    return (
      <AssignProjectsForm
        key={open ? 'open' : 'closed'}
        pieceSet={pieceSet}
        allProjects={allProjects}
        serverAssignedIds={assignedProjects.map((project) => project.id)}
        onOpenChange={onOpenChange}
      />
    );
  })();
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!saving) {
          onOpenChange(next);
        }
      }}
    >
      <DialogContent className={adminLayout.dialog.md}>{body}</DialogContent>
    </Dialog>
  );
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
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(serverAssignedIds),
  );
  const [query, setQuery] = useState('');
  const [orderedProjects] = useState(() =>
    assignedFirst({ projects: allProjects, assignedIds: serverAssignedIds }),
  );
  const {
    data: pieceSets,
    isLoading: setsLoading,
    isError: setsFailed,
    refetch: refetchSets,
  } = pieceSetQueries.useAllPieceSets();
  const moveProjects = usePieceSetProjectMoves();
  const defaultSetId = pieceSets?.find((set) => set.isDefault)?.id;
  const projectsById = useMemo(
    () => new Map(allProjects.map((project) => [project.id, project])),
    [allProjects],
  );
  const setNames = useMemo(
    () => new Map((pieceSets ?? []).map((set) => [set.id, set.name])),
    [pieceSets],
  );

  const serverSet = new Set(serverAssignedIds);
  const added = [...selected].filter((id) => !serverSet.has(id));
  const removed = pieceSet.isDefault
    ? []
    : serverAssignedIds.filter((id) => !selected.has(id));
  const dirty = added.length > 0 || removed.length > 0;
  const movingCount = added.filter((id) => {
    const current = projectsById.get(id)?.pieceSetId;
    return !isNil(current) && current !== defaultSetId;
  }).length;

  const needle = query.trim().toLowerCase();
  const visibleProjects =
    needle === ''
      ? orderedProjects
      : orderedProjects.filter((project) =>
          project.displayName.toLowerCase().includes(needle),
        );

  const save = useMutation({
    mutationKey: saveKey(pieceSet.id),
    mutationFn: () => moveProjects({ pieceSetId: pieceSet.id, added, removed }),
    onSuccess: ({ movedElsewhere }) => {
      if (movedElsewhere.length > 0) {
        mutationFeedback.success(
          t(
            '{count, plural, =1 {1 project had already moved to another {term}, so it stays there.} other {# projects had already moved to another {term}, so they stay there.}} The list is refreshed.',
            { ...pieceSetTerms.get(), count: movedElsewhere.length },
          ),
        );
      } else {
        mutationFeedback.success(t('Projects saved'));
      }
      onOpenChange(false);
    },
    onError: (error) =>
      mutationFeedback.error({
        error,
        title: t("Some project changes weren't saved"),
      }),
  });

  const toggleProject = (projectId: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(projectId)) {
        next.delete(projectId);
      } else {
        next.add(projectId);
      }
      return next;
    });

  return (
    <>
      <DialogHeader>
        <DialogTitle>{t('Assign projects')}</DialogTitle>
        <DialogDescription>
          {pieceSet.isDefault
            ? t(
                'Projects without a {term} already use the Default {term}. Pick projects to move back to it.',
                pieceSetTerms.get(),
              )
            : t('Choose which projects build with {name}.', {
                name: pieceSet.name,
              })}
        </DialogDescription>
      </DialogHeader>
      <div className="flex flex-col gap-2">
        <Input
          type="search"
          value={query}
          placeholder={t('Search projects')}
          aria-label={t('Search projects')}
          onChange={(event) => setQuery(event.target.value)}
        />
        {visibleProjects.length === 0 ? (
          <p className="rounded-xl border p-4 text-sm text-gray-11">
            {t('No projects found')}
          </p>
        ) : (
          <div
            className="rounded-xl border p-1"
            style={{
              height: listUtils.cappedHeight({
                count: visibleProjects.length,
                rowHeight: PROJECT_ROW_HEIGHT,
                padding: 10,
                max: PROJECT_LIST_MAX_HEIGHT,
              }),
            }}
          >
            <VirtualizedScrollArea
              items={visibleProjects}
              estimateSize={() => PROJECT_ROW_HEIGHT}
              getItemKey={(index) => visibleProjects[index].id}
              renderItem={(project) => {
                const row = projectPieceSet.assignRow({
                  pieceSet,
                  project,
                  defaultSetId,
                  setNames,
                });
                return (
                  <label className="flex h-10 min-w-0 cursor-pointer items-center gap-2 rounded-md px-2 hover:bg-gray-3 has-disabled:cursor-default has-disabled:opacity-60">
                    <Checkbox
                      checked={selected.has(project.id)}
                      disabled={row.locked}
                      onCheckedChange={() => toggleProject(project.id)}
                    />
                    <ProjectAvatar project={project} size="sm" />
                    <span className="min-w-0 truncate text-sm">
                      {project.displayName}
                    </span>
                    {row.lockedIn !== null && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span
                            tabIndex={0}
                            className="ml-auto shrink-0 rounded-sm text-xs text-gray-11 focus-visible:outline-2 focus-visible:outline-accent-8"
                          >
                            {t('Already in {name}', { name: row.lockedIn })}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          {t(
                            'To move it out, assign it from another {term}.',
                            pieceSetTerms.get(),
                          )}
                        </TooltipContent>
                      </Tooltip>
                    )}
                    {row.currentlyIn !== null && (
                      <span className="ml-auto shrink-0 text-xs text-gray-11">
                        {t('Currently: {name}', { name: row.currentlyIn })}
                      </span>
                    )}
                  </label>
                );
              }}
            />
          </div>
        )}
      </div>
      {setsFailed && (
        <AdminFetchErrorState
          entity={pieceSetTerms.get().terms}
          onRetry={refetchSets}
        />
      )}
      {movingCount > 0 && (
        <p className="text-xs text-warning-11">
          {t('projectsMovingFromOtherSets', { count: movingCount })}
        </p>
      )}
      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          disabled={save.isPending}
          onClick={() => onOpenChange(false)}
        >
          {t('Cancel')}
        </Button>
        <Button
          {...adminControl(AdminControl.PIECE_SETS_PROJECTS_SUBMIT)}
          type="button"
          loading={save.isPending}
          disabled={!dirty || setsLoading || setsFailed}
          onClick={() => save.mutate()}
        >
          {t('Save')}
        </Button>
      </DialogFooter>
    </>
  );
};

function assignedFirst({
  projects,
  assignedIds,
}: {
  projects: ProjectWithLimits[];
  assignedIds: string[];
}): ProjectWithLimits[] {
  const assigned = new Set(assignedIds);
  return [
    ...projects.filter((project) => assigned.has(project.id)),
    ...projects.filter((project) => !assigned.has(project.id)),
  ];
}

function saveKey(pieceSetId: string) {
  return ['piece-set-projects-save', pieceSetId];
}

const PROJECT_ROW_HEIGHT = 40;
const PROJECT_LIST_MAX_HEIGHT = 288;

type PieceSetProjectsDialogProps = {
  pieceSet: PieceSet;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};
