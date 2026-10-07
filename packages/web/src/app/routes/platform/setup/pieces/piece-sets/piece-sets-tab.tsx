import {
  isNil,
  PieceSelectionMode,
  PieceSet,
  ProjectWithLimits,
} from '@activepieces/shared';
import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import {
  Copy,
  Layers,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Star,
  Trash2,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';

import {
  AdminDataTable,
  AdminPage,
  AdminPageHeader,
  StatusDot,
  adminPageResources,
} from '@/app/components/admin';
import { PlanFeatureSample } from '@/app/routes/platform/plan-feature-sample';
import { RowDataWithActions } from '@/components/custom/data-table';
import { DataTableColumnHeader } from '@/components/custom/data-table/data-table-column-header';
import { FormattedDate } from '@/components/custom/formatted-date';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { PolicyConfirmDialog } from './policy-ui';

export function PieceSetsTab() {
  const { platform } = platformHooks.useCurrentPlatform();
  if (!platform.plan.managePiecesEnabled) {
    return (
      <PlanFeatureSample feature="piecePolicies">
        <SamplePieceSetsList />
      </PlanFeatureSample>
    );
  }
  return <LivePieceSetsList />;
}

function LivePieceSetsList() {
  const {
    data: pieceSets,
    isLoading,
    isError,
    refetch,
  } = pieceSetQueries.useAllPieceSets();
  const { data: platformsData, isLoading: projectsLoading } =
    projectHooks.useProjectsForPlatforms();
  const projectCounts = useMemo(
    () =>
      countProjectsPerSet({
        pieceSets: pieceSets ?? [],
        projects: platformsData?.flatMap((p) => p.projects),
      }),
    [pieceSets, platformsData],
  );
  return (
    <PieceSetsList
      pieceSets={pieceSets ?? []}
      projectCounts={projectCounts}
      projectsLoading={projectsLoading}
      isLoading={isLoading}
      isError={isError}
      onRetry={refetch}
    />
  );
}

function SamplePieceSetsList() {
  const { pieces: catalog } = piecesHooks.usePieces({
    includeHidden: true,
    isTableQuery: true,
    skipProjectFilter: true,
  });
  const pieceSets = useMemo(
    () =>
      pieceSetSamples.samplePieceSets({
        pieceNames: (catalog ?? []).map((piece) => piece.name),
      }),
    [catalog],
  );
  return (
    <PieceSetsList
      pieceSets={pieceSets}
      projectCounts={pieceSetSamples.sampleProjectCounts()}
      projectsLoading={false}
      isLoading={false}
      isError={false}
    />
  );
}

function PieceSetsList({
  pieceSets,
  projectCounts,
  projectsLoading,
  isLoading,
  isError,
  onRetry,
}: PieceSetsListProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const search = searchParams.get(SEARCH_PARAM) ?? '';
  const [creating, setCreating] = useState(false);
  const [duplicatingSet, setDuplicatingSet] = useState<PieceSet | null>(null);
  const [editingSet, setEditingSet] = useState<PieceSet | null>(null);
  const [deletingSet, setDeletingSet] = useState<PieceSet | null>(null);
  const { mutateAsync: deleteSet } = pieceSetMutations.useDeletePieceSet();

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
    navigate(`/platform/pieces/piece-sets/${set.id}`);

  const columns: ColumnDef<RowDataWithActions<PieceSet>>[] = useMemo(
    () => [
      {
        accessorKey: 'name',
        size: 360,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('Policy')} />
        ),
        cell: ({ row }) => (
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="flex min-w-0 items-center gap-2">
              <span className="truncate font-medium text-gray-12">
                {row.original.name}
              </span>
              {row.original.isDefault && (
                <Badge variant="outline">{t('Default')}</Badge>
              )}
            </span>
            <span className="truncate text-xs text-gray-11">
              {selectionSentence(row.original)}
            </span>
          </div>
        ),
      },
      {
        accessorKey: 'key',
        size: 150,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('Embed key')} />
        ),
        cell: ({ row }) =>
          row.original.key ? (
            <span className="font-mono text-xs text-gray-11">
              {row.original.key}
            </span>
          ) : (
            <span className="text-gray-11">—</span>
          ),
      },
      {
        id: 'appliesTo',
        size: 170,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('Applies to')} />
        ),
        cell: ({ row }) => {
          if (row.original.isDefault) {
            return (
              <span className="text-gray-11">{t('Every other project')}</span>
            );
          }
          const count = projectCounts.get(row.original.id);
          if (count === undefined) {
            return projectsLoading ? (
              <Skeleton className="h-4 w-20" />
            ) : (
              <span className="text-gray-11">—</span>
            );
          }
          return (
            <span className="text-gray-11">
              {t(
                '{count, plural, =0 {No projects} =1 {1 project} other {# projects}}',
                { count },
              )}
            </span>
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
        size: 140,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('Required')} />
        ),
        cell: ({ row }) => {
          const count = pieceSetChanges.countRequiredActions(
            row.original.config,
          );
          return count === 0 ? (
            <span className="text-gray-11">—</span>
          ) : (
            <span className="flex min-w-0 items-center gap-1.5 text-gray-12">
              <Star className="size-3.5 shrink-0 fill-current text-warning-11" />
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
        size: 140,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('Updated')} />
        ),
        cell: ({ row }) => (
          <FormattedDate
            date={new Date(row.original.updated)}
            className="text-gray-11"
          />
        ),
      },
      {
        id: 'actions',
        size: 56,
        notClickable: true,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={t('More actions')}
                >
                  <MoreHorizontal />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-44">
                <DropdownMenuItem
                  {...adminControl(AdminControl.PIECE_SETS_EDIT_OPEN)}
                  onSelect={() => setEditingSet(row.original)}
                >
                  <Pencil />
                  {t('Edit details')}
                </DropdownMenuItem>
                <DropdownMenuItem
                  {...adminControl(AdminControl.PIECE_SETS_DUPLICATE_OPEN)}
                  onSelect={() => setDuplicatingSet(row.original)}
                >
                  <Copy />
                  {t('Duplicate')}
                </DropdownMenuItem>
                {!row.original.isDefault && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      {...adminControl(AdminControl.PIECE_SETS_DELETE_OPEN)}
                      variant="destructive"
                      onSelect={() => setDeletingSet(row.original)}
                    >
                      <Trash2 />
                      {t('Delete')}
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
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
      <Plus />
      {t('New policy')}
    </Button>
  );
  const filtered = search.trim() !== '';

  return (
    <AdminPage>
      <AdminPageHeader
        title={t('Piece policies')}
        description={t(
          'A policy decides which pieces, actions and triggers its projects can use, and which actions a flow must use before it can be published.',
        )}
        resources={adminPageResources.pieces}
      >
        {newSetButton}
      </AdminPageHeader>
      <AdminDataTable
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
        emptyStateIcon={<Layers />}
        emptyStateAction={filtered ? undefined : newSetButton}
        columns={columns}
        filters={[
          {
            type: 'input',
            title: t('Search by name or embed key'),
            accessorKey: SEARCH_PARAM,
            icon: Search,
          },
        ]}
        page={{ data: visibleSets, next: null, previous: null }}
        onRowClick={(row) => openSet(row)}
        isLoading={isLoading}
        isError={isError}
        errorStateEntity={t('piece policies')}
        onRetry={onRetry}
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
        <PolicyConfirmDialog
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
          onConfirm={async () => {
            await deleteSet(deletingSet.id);
            toast.success(t('{name} deleted', { name: deletingSet.name }));
          }}
        />
      )}
    </AdminPage>
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

const SEARCH_PARAM = 'name';

type PieceSetsListProps = {
  pieceSets: PieceSet[];
  projectCounts: Map<string, number>;
  projectsLoading: boolean;
  isLoading: boolean;
  isError: boolean;
  onRetry?: () => void;
};
