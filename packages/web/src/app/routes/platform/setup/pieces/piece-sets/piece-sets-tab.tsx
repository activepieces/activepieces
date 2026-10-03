import { PieceSelectionMode, PieceSet } from '@activepieces/shared';
import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import {
  ChevronRight,
  Copy,
  Layers,
  MoreHorizontal,
  Pencil,
  Trash2,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { ConfirmDialog } from '@/components/custom/confirm-dialog';
import {
  CURSOR_QUERY_PARAM,
  DataTable,
  RowDataWithActions,
} from '@/components/custom/data-table';
import { DataTableColumnHeader } from '@/components/custom/data-table/data-table-column-header';
import { Page, PageHeader, Toolbar } from '@/components/custom/page';
import { SearchInput } from '@/components/custom/search-input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { pieceSetMutations, pieceSetQueries } from '@/features/piece-sets';
import { formatUtils } from '@/lib/format-utils';

import { CreatePieceSetDialog } from './create-piece-set-dialog';
import { DuplicatePieceSetDialog } from './duplicate-piece-set-dialog';
import { EditPieceSetDialog } from './edit-piece-set-dialog';

export const PieceSetsTab = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [duplicatingSet, setDuplicatingSet] = useState<PieceSet | null>(null);
  const [editingSet, setEditingSet] = useState<PieceSet | null>(null);
  const [deletingSet, setDeletingSet] = useState<PieceSet | null>(null);

  const cursor = searchParams.get(CURSOR_QUERY_PARAM) ?? undefined;
  const limitParam = searchParams.get('limit');
  const limit = limitParam ? parseInt(limitParam, 10) : undefined;

  const {
    data: pieceSetsPage,
    isLoading,
    isError,
    refetch,
  } = pieceSetQueries.usePieceSets({ cursor, limit });
  const { mutate: deleteSet } = pieceSetMutations.useDeletePieceSet();

  const pieceSets = useMemo(() => pieceSetsPage?.data ?? [], [pieceSetsPage]);
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
  const hasMorePages = !!pieceSetsPage?.next || !!pieceSetsPage?.previous;

  const openSet = (set: PieceSet) =>
    navigate(`/platform/pieces/piece-sets/${set.id}`);

  const columns: ColumnDef<RowDataWithActions<PieceSet>>[] = [
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Set')} />
      ),
      cell: ({ row }) => (
        <div className="flex min-w-0 flex-col gap-0.5">
          <div className="flex min-w-0 items-center gap-2">
            <span className="truncate font-medium text-gray-12">
              {row.original.name}
            </span>
            {row.original.isDefault && (
              <Badge variant="outline">{t('Default')}</Badge>
            )}
          </div>
          <span className="truncate text-xs text-gray-11">
            {selectionSentence(row.original)}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'key',
      size: 200,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Key')} />
      ),
      cell: ({ row }) =>
        row.original.key ? (
          <span className="font-mono text-xs text-gray-12">
            {row.original.key}
          </span>
        ) : (
          <span className="text-gray-11">—</span>
        ),
    },
    {
      id: 'curated',
      size: 280,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Curated pieces')} />
      ),
      cell: ({ row }) => {
        const curatedCount = curatedPieceCount(row.original);
        return (
          <span className="text-gray-11">
            {curatedCount === 0
              ? t('None')
              : t(
                  '{count, plural, =1 {1 piece limited to some actions} other {# pieces limited to some actions}}',
                  { count: curatedCount },
                )}
          </span>
        );
      },
    },
    {
      accessorKey: 'updated',
      size: 120,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Updated')} />
      ),
      cell: ({ row }) => (
        <span className="text-gray-11 tabular-nums">
          {formatUtils.formatDate(new Date(row.original.updated))}
        </span>
      ),
    },
    {
      id: 'actions',
      size: 56,
      cell: ({ row }) => (
        <div className="flex justify-end">
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={t('More actions')}
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              onClick={(e) => e.stopPropagation()}
            >
              <DropdownMenuItem onSelect={() => openSet(row.original)}>
                <ChevronRight />
                {t('Open')}
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setEditingSet(row.original)}>
                <Pencil />
                {t('Edit details')}
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => setDuplicatingSet(row.original)}
              >
                <Copy />
                {t('Duplicate')}
              </DropdownMenuItem>
              {!row.original.isDefault && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
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
  ];

  return (
    <Page>
      <PageHeader
        title={t('Piece sets')}
        description={t(
          'A set is the list of pieces, and the actions within them, a project may use. Projects use the default set unless you assign another.',
        )}
      >
        <CreatePieceSetDialog onCreated={() => refetch()} />
      </PageHeader>
      <Toolbar>
        <div className="w-full max-w-sm">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder={t('Search by name or key')}
          />
        </div>
      </Toolbar>
      <DataTable
        emptyStateTextTitle={
          pieceSets.length === 0 ? t('No piece sets yet') : t('No set matches')
        }
        emptyStateTextDescription={
          pieceSets.length === 0
            ? t(
                'A set decides which pieces and actions a project may build with. Create one and assign it to the projects that need it.',
              )
            : t('Try a different search.')
        }
        emptyStateIcon={<Layers className="size-6 text-gray-9" />}
        columns={columns}
        page={{
          data: visibleSets,
          next: pieceSetsPage?.next ?? null,
          previous: pieceSetsPage?.previous ?? null,
        }}
        onRowClick={(row) => openSet(row)}
        isLoading={isLoading}
        isError={isError}
        errorStateEntity={t('piece sets')}
        onRetry={refetch}
        hidePagination={!hasMorePages}
      />
      {duplicatingSet && (
        <DuplicatePieceSetDialog
          open={!!duplicatingSet}
          onOpenChange={(open) => {
            if (!open) setDuplicatingSet(null);
          }}
          sourceId={duplicatingSet.id}
          sourceName={duplicatingSet.name}
        />
      )}
      {editingSet && (
        <EditPieceSetDialog
          open={!!editingSet}
          onOpenChange={(open) => {
            if (!open) setEditingSet(null);
          }}
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
            deleteSet(deletingSet.id);
          }}
        />
      )}
    </Page>
  );
};

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

function curatedPieceCount(set: PieceSet): number {
  return new Set([
    ...Object.keys(set.config.selectedActions),
    ...Object.keys(set.config.selectedTriggers),
  ]).size;
}
