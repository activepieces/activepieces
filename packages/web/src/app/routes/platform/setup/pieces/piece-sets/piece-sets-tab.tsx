import { PieceSet } from '@activepieces/shared';
import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import {
  CheckIcon,
  Copy,
  Hash,
  Layers,
  LayoutGrid,
  Settings2,
  ToggleLeft,
  Trash2,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { DataTable, RowDataWithActions } from '@/components/custom/data-table';
import { DataTableColumnHeader } from '@/components/custom/data-table/data-table-column-header';
import { ConfirmationDeleteDialog } from '@/components/custom/delete-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { pieceSetMutations, pieceSetQueries } from '@/features/piece-sets';

import { CreatePieceSetDialog } from './create-piece-set-dialog';
import { DuplicatePieceSetDialog } from './duplicate-piece-set-dialog';
import { EditPieceSetDialog } from './edit-piece-set-dialog';

export const PieceSetsTab = () => {
  const navigate = useNavigate();
  const [duplicatingSet, setDuplicatingSet] = useState<PieceSet | null>(null);
  const [editingSet, setEditingSet] = useState<PieceSet | null>(null);

  const {
    data: pieceSetsPage,
    isLoading,
    refetch,
  } = pieceSetQueries.usePieceSets();
  const { mutate: deleteSet } = pieceSetMutations.useDeletePieceSet();

  const pieceSets = useMemo(() => pieceSetsPage?.data ?? [], [pieceSetsPage]);

  const columns: ColumnDef<RowDataWithActions<PieceSet>>[] = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t('Name')}
            icon={LayoutGrid}
          />
        ),
        cell: ({ row }) => (
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() =>
              navigate(`/platform/setup/pieces/piece-sets/${row.original.id}`)
            }
          >
            <span className="font-medium">{row.original.name}</span>
            {row.original.isDefault && (
              <Badge variant="default">{t('Default')}</Badge>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'externalId',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t('External ID')}
            icon={Hash}
          />
        ),
        cell: ({ row }) =>
          row.original.externalId ? (
            <span className="font-mono text-sm">{row.original.externalId}</span>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
      {
        accessorKey: 'includeNewPieces',
        size: 160,
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t('Include new pieces')}
            icon={ToggleLeft}
          />
        ),
        cell: ({ row }) => (
          <Badge
            variant={row.original.includeNewPieces ? 'success' : 'outline'}
          >
            {row.original.includeNewPieces ? t('Yes') : t('No')}
          </Badge>
        ),
      },
      {
        id: 'actions',
        size: 80,
        cell: ({ row }) => (
          <div className="flex justify-end gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingSet(row.original)}
                >
                  <Settings2 className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t('Edit Details')}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDuplicatingSet(row.original)}
                >
                  <Copy className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t('Duplicate')}</TooltipContent>
            </Tooltip>
            <ConfirmationDeleteDialog
              title={t('Delete {name}', { name: row.original.name })}
              entityName={t('Piece Set')}
              message={t(
                'Projects assigned to this set will be reassigned to the default set.',
              )}
              mutationFn={async () => {
                deleteSet(row.original.id);
              }}
            >
              <Button
                variant="ghost"
                size="sm"
                disabled={row.original.isDefault}
              >
                <Trash2 className="size-4 text-destructive" />
              </Button>
            </ConfirmationDeleteDialog>
          </div>
        ),
      },
    ],
    [deleteSet, navigate, setDuplicatingSet, setEditingSet],
  );

  return (
    <>
      <DataTable
        emptyStateTextTitle={t('No piece sets found')}
        emptyStateTextDescription={t(
          'Create a piece set to control which pieces are available to specific projects',
        )}
        emptyStateIcon={<Layers className="size-14" />}
        columns={columns}
        filters={[
          {
            type: 'input',
            title: t('Set Name'),
            accessorKey: 'name',
            icon: CheckIcon,
          },
        ]}
        page={{
          data: pieceSets,
          next: null,
          previous: null,
        }}
        isLoading={isLoading}
        hidePagination={true}
        clientFiltering={true}
        toolbarButtons={[
          <CreatePieceSetDialog key="create" onCreated={() => refetch()} />,
        ]}
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
          currentExternalId={editingSet.externalId ?? null}
          currentIncludeNewPieces={editingSet.includeNewPieces}
        />
      )}
    </>
  );
};
