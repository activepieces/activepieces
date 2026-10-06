import {
  isNil,
  PieceSelectionMode,
  PieceSet,
  ProjectWithLimits,
} from '@activepieces/shared';
import {
  Add01Icon,
  Copy01Icon,
  Delete02Icon,
  Layers01Icon,
  PencilEdit01Icon,
  StarIcon,
} from '@hugeicons/core-free-icons';
import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { AdminPageHeader } from '@/app/routes/platform/admin-page-header';
import { ConfirmDialog } from '@/components/custom/confirm-dialog';
import { DataTable, RowDataWithActions } from '@/components/custom/data-table';
import { DataTableColumnHeader } from '@/components/custom/data-table/data-table-column-header';
import { HugeiconsIcon } from '@/components/custom/hugeicons-icon';
import {
  DateCell,
  MutedCell,
  NameCell,
} from '@/components/custom/list/list-cells';
import { ListSearch, ListToolbar } from '@/components/custom/list/list-toolbar';
import { RowMenu } from '@/components/custom/list/row-menu';
import { Page } from '@/components/custom/page';
import { StatusDot } from '@/components/custom/status-dot';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  pieceSetChanges,
  pieceSetMutations,
  pieceSetQueries,
} from '@/features/piece-sets';
import { piecesHooks } from '@/features/pieces';
import { projectHooks } from '@/features/projects';
import { platformHooks } from '@/hooks/platform-hooks';
import { AdminControl, adminControl } from '@/lib/admin-control';

import { CreatePieceSetDialog } from './create-piece-set-dialog';
import { DuplicatePieceSetDialog } from './duplicate-piece-set-dialog';
import { EditPieceSetDialog } from './edit-piece-set-dialog';
import { pieceSetSamples } from './piece-set-samples';

export function PieceSetsTab() {
  const navigate = useNavigate();
  const { platform } = platformHooks.useCurrentPlatform();
  const locked = !platform.plan.managePiecesEnabled;
  const [searchParams] = useSearchParams();
  const search = searchParams.get('search') ?? '';
  const [creating, setCreating] = useState(false);
  const [duplicatingSet, setDuplicatingSet] = useState<PieceSet | null>(null);
  const [editingSet, setEditingSet] = useState<PieceSet | null>(null);
  const [deletingSet, setDeletingSet] = useState<PieceSet | null>(null);

  const {
    data: fetchedSets,
    isLoading,
    isError,
    refetch,
  } = pieceSetQueries.useAllPieceSets();
  const { data: platformsData, isLoading: projectsLoading } =
    projectHooks.useProjectsForPlatforms();
  const { mutateAsync: deleteSet } = pieceSetMutations.useDeletePieceSet();
  const { pieces: catalog } = piecesHooks.usePieces({
    includeHidden: true,
    isTableQuery: true,
    skipProjectFilter: true,
    enabled: locked,
  });

  const pieceSets = useMemo(
    () =>
      locked
        ? pieceSetSamples.samplePieceSets({
            pieceNames: (catalog ?? []).map((piece) => piece.name),
          })
        : fetchedSets ?? [],
    [locked, fetchedSets, catalog],
  );
  const projectCounts = useMemo(
    () =>
      locked
        ? pieceSetSamples.sampleProjectCounts()
        : countProjectsPerSet({
            pieceSets,
            projects: platformsData?.flatMap((p) => p.projects),
          }),
    [locked, pieceSets, platformsData],
  );
  const deletingSetProjects = deletingSet
    ? projectCounts.get(deletingSet.id)
    : undefined;
  const visibleSets = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (query === '') {
      return pieceSets;
    }
    return pieceSets.filter(
      (set) =>
        set.name.toLowerCase().includes(query) ||
        (set.key ?? '').toLowerCase().includes(query),
    );
  }, [pieceSets, search]);

  const openSet = (set: PieceSet) =>
    navigate(`/platform/pieces/policies/${set.id}`);

  const columns = useMemo(
    (): ColumnDef<RowDataWithActions<PieceSet>>[] => [
      {
        accessorKey: 'name',
        size: 400,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('Policy')} />
        ),
        cell: ({ row }) => (
          <NameCell
            stacked
            title={row.original.name}
            badge={
              row.original.isDefault ? (
                <Badge variant="outline">{t('Default')}</Badge>
              ) : undefined
            }
            sub={selectionSentence(row.original)}
          />
        ),
      },
      {
        accessorKey: 'key',
        size: 150,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('Embed key')} />
        ),
        cell: ({ row }) => (
          <MutedCell className="font-mono text-xs">
            {row.original.key}
          </MutedCell>
        ),
      },
      {
        id: 'appliesTo',
        size: 170,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('Applies to')} />
        ),
        cell: ({ row }) => {
          const count = projectCounts.get(row.original.id);
          if (row.original.isDefault) {
            return <MutedCell>{t('Every other project')}</MutedCell>;
          }
          if (count === undefined) {
            return projectsLoading ? (
              <Skeleton className="h-4 w-20" />
            ) : (
              <MutedCell>{null}</MutedCell>
            );
          }
          return (
            <MutedCell>
              {t(
                '{count, plural, =0 {No projects} =1 {1 project} other {# projects}}',
                { count },
              )}
            </MutedCell>
          );
        },
      },
      {
        id: 'newPieces',
        size: 120,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('New pieces')} />
        ),
        cell: ({ row }) =>
          row.original.config.pieces.mode === PieceSelectionMode.INCLUDE_ALL ? (
            <StatusDot tone="success">{t('Allowed')}</StatusDot>
          ) : (
            <StatusDot tone="neutral">{t('Blocked')}</StatusDot>
          ),
      },
      {
        id: 'required',
        size: 160,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('Required')} />
        ),
        cell: ({ row }) => {
          const count = pieceSetChanges.countRequiredActions(
            row.original.config,
          );
          return count === 0 ? (
            <MutedCell>{null}</MutedCell>
          ) : (
            <span className="flex min-w-0 items-center gap-1.5 text-gray-12">
              <HugeiconsIcon
                icon={StarIcon}
                className="size-3.5 shrink-0 fill-current text-warning-11"
              />
              <span className="truncate">
                {t('{count, plural, =1 {1 action} other {# actions}}', {
                  count,
                })}
              </span>
            </span>
          );
        },
      },
      {
        accessorKey: 'updated',
        size: 132,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('Updated')} />
        ),
        cell: ({ row }) => <DateCell value={row.original.updated} />,
      },
      {
        id: 'actions',
        size: 56,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <RowMenu
              items={[
                {
                  label: t('Edit details'),
                  icon: PencilEdit01Icon,
                  onSelect: () => setEditingSet(row.original),
                  control: AdminControl.PIECE_SETS_EDIT_OPEN,
                },
                {
                  label: t('Duplicate'),
                  icon: Copy01Icon,
                  onSelect: () => setDuplicatingSet(row.original),
                  control: AdminControl.PIECE_SETS_DUPLICATE_OPEN,
                },
                {
                  label: t('Delete'),
                  icon: Delete02Icon,
                  destructive: true,
                  hidden: row.original.isDefault,
                  onSelect: () => setDeletingSet(row.original),
                  control: AdminControl.PIECE_SETS_DELETE_OPEN,
                },
              ]}
            />
          </div>
        ),
      },
    ],
    [projectCounts, projectsLoading],
  );

  const newSetButton = (
    <Button
      {...adminControl(AdminControl.PIECE_SETS_CREATE_OPEN)}
      onClick={() => setCreating(true)}
    >
      <HugeiconsIcon icon={Add01Icon} />
      {t('New policy')}
    </Button>
  );
  const filtered = search.trim() !== '';

  return (
    <Page>
      <AdminPageHeader page="piecePolicies">{newSetButton}</AdminPageHeader>
      <ListToolbar
        search={<ListSearch placeholder={t('Search by name or embed key')} />}
      />
      <DataTable
        emptyStateTextTitle={
          filtered ? t('No policy matches') : t('No policies yet')
        }
        emptyStateTextDescription={
          filtered
            ? t('Try a different search.')
            : t(
                'Every project uses the Default policy. Make a policy to give some projects fewer pieces, or require actions in their flows.',
              )
        }
        emptyStateIcon={<HugeiconsIcon icon={Layers01Icon} />}
        emptyStateAction={filtered ? undefined : newSetButton}
        columns={columns}
        page={{ data: visibleSets, next: null, previous: null }}
        onRowClick={(row) => openSet(row)}
        isLoading={!locked && isLoading}
        isError={!locked && isError}
        errorStateEntity={t('piece policies')}
        onRetry={refetch}
        hidePagination
      />
      <CreatePieceSetDialog
        open={creating}
        onOpenChange={setCreating}
        onCreated={(pieceSet) => openSet(pieceSet)}
      />
      {duplicatingSet && (
        <DuplicatePieceSetDialog
          open
          onOpenChange={(open) => !open && setDuplicatingSet(null)}
          sourceId={duplicatingSet.id}
          sourceName={duplicatingSet.name}
        />
      )}
      {editingSet && (
        <EditPieceSetDialog
          open
          onOpenChange={(open) => !open && setEditingSet(null)}
          id={editingSet.id}
          currentName={editingSet.name}
          currentKey={editingSet.key ?? null}
        />
      )}
      {deletingSet && (
        <ConfirmDialog
          open
          onOpenChange={(open) => !open && setDeletingSet(null)}
          title={t('Delete {name}?', { name: deletingSet.name })}
          description={t('The policy is removed from the platform.')}
          consequence={
            deletingSetProjects === undefined
              ? t('Its projects move to the Default policy.')
              : t(
                  '{count, plural, =0 {No projects use this policy.} =1 {1 project moves to the Default policy.} other {# projects move to the Default policy.}}',
                  { count: deletingSetProjects },
                )
          }
          typeToConfirm={
            deletingSetProjects === 0 ? undefined : deletingSet.name
          }
          confirmLabel={t('Delete policy')}
          controlId={AdminControl.PIECE_SETS_DELETE_CONFIRM}
          successMessage={t('{name} deleted', { name: deletingSet.name })}
          errorTitle={t("Couldn't delete the policy")}
          onConfirm={() => deleteSet(deletingSet.id)}
        />
      )}
    </Page>
  );
}

function selectionSentence(set: PieceSet): string {
  const count = set.config.pieces.exceptions.length;
  if (set.config.pieces.mode === PieceSelectionMode.INCLUDE_ALL) {
    return count === 0
      ? t('Every piece')
      : t('Every piece except {count}', { count });
  }
  return t('{count, plural, =1 {Only 1 piece} other {Only # pieces}}', {
    count,
  });
}

function countProjectsPerSet({
  pieceSets,
  projects,
}: {
  pieceSets: PieceSet[];
  projects: ProjectWithLimits[] | undefined;
}): Map<string, number> {
  if (isNil(projects)) {
    return new Map();
  }
  const defaultSetId = pieceSets.find((set) => set.isDefault)?.id;
  return projects.reduce((counts, project) => {
    const setId = project.pieceSetId ?? defaultSetId;
    if (isNil(setId)) {
      return counts;
    }
    return new Map(counts).set(setId, (counts.get(setId) ?? 0) + 1);
  }, new Map<string, number>(pieceSets.map((set) => [set.id, 0])));
}
