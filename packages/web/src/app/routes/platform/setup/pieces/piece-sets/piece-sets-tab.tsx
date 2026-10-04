import {
  isNil,
  PieceSelectionMode,
  PieceSet,
  ProjectWithLimits,
} from '@activepieces/shared';
import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import { Copy, Layers, Pencil, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { AdminTabs } from '@/app/routes/platform/admin-tabs';
import { PlanFeatureSample } from '@/app/routes/platform/plan-feature-sample';
import { ConfirmDialog } from '@/components/custom/confirm-dialog';
import { DataTable, RowDataWithActions } from '@/components/custom/data-table';
import { DataTableColumnHeader } from '@/components/custom/data-table/data-table-column-header';
import {
  DateCell,
  MutedCell,
  NameCell,
  NumberCell,
} from '@/components/custom/list/list-cells';
import { ListSearch, ListToolbar } from '@/components/custom/list/list-toolbar';
import { RowMenu } from '@/components/custom/list/row-menu';
import { Page, PageHeader } from '@/components/custom/page';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { pieceSetMutations, pieceSetQueries } from '@/features/piece-sets';
import { projectHooks } from '@/features/projects';
import { platformHooks } from '@/hooks/platform-hooks';

import { CreatePieceSetDialog } from './create-piece-set-dialog';
import { DuplicatePieceSetDialog } from './duplicate-piece-set-dialog';
import { EditPieceSetDialog } from './edit-piece-set-dialog';

export const PieceSetsTab = () => (
  <PlanFeatureSample feature="pieceSets">
    <PieceSetsPage />
  </PlanFeatureSample>
);

function PieceSetsPage() {
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
  const { data: platformsData } = projectHooks.useProjectsForPlatforms();
  const { mutateAsync: deleteSet } = pieceSetMutations.useDeletePieceSet();

  const pieceSets = useMemo(
    () => (locked ? SAMPLE_PIECE_SETS : fetchedSets ?? []),
    [locked, fetchedSets],
  );
  const projectCounts = useMemo(
    () =>
      locked
        ? SAMPLE_PROJECT_COUNTS
        : countProjectsPerSet({
            pieceSets,
            projects: platformsData?.flatMap((p) => p.projects),
          }),
    [locked, pieceSets, platformsData],
  );
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

  const columns: ColumnDef<RowDataWithActions<PieceSet>>[] = [
    {
      accessorKey: 'name',
      size: 400,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Set')} />
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
      size: 200,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Key')} />
      ),
      cell: ({ row }) => (
        <MutedCell className="font-mono text-xs">{row.original.key}</MutedCell>
      ),
    },
    {
      id: 'projects',
      size: 120,
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t('Projects')}
          className="justify-end"
        />
      ),
      cell: ({ row }) => (
        <NumberCell value={projectCounts.get(row.original.id)} />
      ),
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
                icon: Pencil,
                onSelect: () => setEditingSet(row.original),
              },
              {
                label: t('Duplicate'),
                icon: Copy,
                onSelect: () => setDuplicatingSet(row.original),
              },
              {
                label: t('Delete'),
                icon: Trash2,
                destructive: true,
                hidden: row.original.isDefault,
                onSelect: () => setDeletingSet(row.original),
              },
            ]}
          />
        </div>
      ),
    },
  ];

  const newSetButton = (
    <Button onClick={() => setCreating(true)}>
      <Plus />
      {t('New piece set')}
    </Button>
  );
  const filtered = search.trim() !== '';

  return (
    <Page>
      <PageHeader
        title={t('Pieces')}
        description={t(
          'A set is the list of pieces, and the actions inside them, a project may build with. Projects use the default set unless you assign another.',
        )}
      >
        {newSetButton}
      </PageHeader>
      <AdminTabs section="pieces" />
      <ListToolbar
        search={<ListSearch placeholder={t('Search by name or key')} />}
      />
      <DataTable
        emptyStateTextTitle={
          filtered ? t('No set matches') : t('No piece sets yet')
        }
        emptyStateTextDescription={
          filtered
            ? t('Try a different search.')
            : t(
                'A set decides which pieces and actions a project may build with. Create one and assign it to the projects that need it.',
              )
        }
        emptyStateIcon={<Layers />}
        emptyStateAction={filtered ? undefined : newSetButton}
        columns={columns}
        page={{ data: visibleSets, next: null, previous: null }}
        onRowClick={(row) => openSet(row)}
        isLoading={!locked && isLoading}
        isError={!locked && isError}
        errorStateEntity={t('piece sets')}
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
          description={t('The set is removed from the platform.')}
          consequence={t('Projects on this set move to the default set.')}
          typeToConfirm={deletingSet.name}
          confirmLabel={t('Delete set')}
          onConfirm={async () => {
            await deleteSet(deletingSet.id);
          }}
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

function samplePieceSet({
  id,
  name,
  key,
  isDefault,
  mode,
  exceptions,
  daysAgo,
}: {
  id: string;
  name: string;
  key: string | null;
  isDefault: boolean;
  mode: PieceSelectionMode;
  exceptions: number;
  daysAgo: number;
}): PieceSet {
  const updated = new Date(Date.now() - daysAgo * DAY_MS).toISOString();
  return {
    id,
    created: updated,
    updated,
    platformId: 'sample',
    name,
    key,
    isDefault,
    generatedForProjectId: null,
    config: {
      pieces: {
        mode,
        exceptions: Array.from(
          { length: exceptions },
          (_, index) => `piece-${index}`,
        ),
      },
      selectedActions: {},
      selectedTriggers: {},
    },
  };
}

const DAY_MS = 24 * 60 * 60 * 1000;

const SAMPLE_PIECE_SETS: PieceSet[] = [
  samplePieceSet({
    id: 'sample-default',
    name: 'Everyone',
    key: null,
    isDefault: true,
    mode: PieceSelectionMode.INCLUDE_ALL,
    exceptions: 3,
    daysAgo: 2,
  }),
  samplePieceSet({
    id: 'sample-finance',
    name: 'Finance',
    key: 'finance',
    isDefault: false,
    mode: PieceSelectionMode.EXCLUDE_ALL,
    exceptions: 12,
    daysAgo: 9,
  }),
  samplePieceSet({
    id: 'sample-support',
    name: 'Customer support',
    key: 'support',
    isDefault: false,
    mode: PieceSelectionMode.EXCLUDE_ALL,
    exceptions: 24,
    daysAgo: 21,
  }),
];

const SAMPLE_PROJECT_COUNTS = new Map<string, number>([
  ['sample-default', 9],
  ['sample-finance', 3],
  ['sample-support', 4],
]);
