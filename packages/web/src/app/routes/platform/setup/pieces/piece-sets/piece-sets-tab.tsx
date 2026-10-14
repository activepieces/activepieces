import { PieceSelectionMode, PieceSet } from '@activepieces/shared';
import { useQueryClient } from '@tanstack/react-query';
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
import { useNavigate, useSearchParams } from 'react-router-dom';

import {
  AdminDataTable,
  AdminPage,
  AdminPageHeader,
  ConfirmDialog,
  RowActionTooltip,
  StatusDot,
  adminPageResources,
  useAdminAction,
} from '@/app/components/admin';
import {
  CURSOR_QUERY_PARAM,
  RowDataWithActions,
} from '@/components/custom/data-table';
import { DataTableColumnHeader } from '@/components/custom/data-table/data-table-column-header';
import { TextWithTooltip } from '@/components/custom/text-with-tooltip';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  pieceSetCacheUtils,
  pieceSetQueries,
  pieceSetsApi,
} from '@/features/piece-sets';
import { platformHooks } from '@/hooks/platform-hooks';
import { AdminControl, adminControl } from '@/lib/admin-control';

import { CreatePieceSetDialog } from './create-piece-set-dialog';
import { DuplicatePieceSetDialog } from './duplicate-piece-set-dialog';
import { EditPieceSetDialog } from './edit-piece-set-dialog';
import { pieceSetName } from './piece-set-name';

export const PieceSetsTab = () => {
  const { platform } = platformHooks.useCurrentPlatform();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [duplicatingSet, setDuplicatingSet] = useState<PieceSet | null>(null);
  const [editingSet, setEditingSet] = useState<PieceSet | null>(null);

  const cursor = searchParams.get(CURSOR_QUERY_PARAM) ?? undefined;
  const limitParam = searchParams.get('limit');
  const limit = limitParam ? parseInt(limitParam, 10) : undefined;

  const {
    data: pieceSetsPage,
    isLoading,
    isError,
    refetch,
  } = pieceSetQueries.usePieceSets({ cursor, limit });
  const queryClient = useQueryClient();
  const { mutateAsync: deleteSet } = useAdminAction<PieceSet>({
    verb: 'delete',
    name: (pieceSet) => pieceSetName.short(pieceSet.name),
    run: (pieceSet) => pieceSetsApi.delete(pieceSet.id),
    onSuccess: () => {
      pieceSetCacheUtils
        .refreshAfterProjectChange({ queryClient })
        .catch(() => undefined);
    },
  });

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
          <div className="flex min-w-0 items-center gap-2">
            <TextWithTooltip tooltipMessage={row.original.name}>
              <span className="min-w-0 font-medium">{row.original.name}</span>
            </TextWithTooltip>
            {row.original.isDefault && (
              <Badge variant="default" className="shrink-0">
                {t('Default')}
              </Badge>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'key',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('Key')} icon={Hash} />
        ),
        cell: ({ row }) =>
          row.original.key ? (
            <TextWithTooltip tooltipMessage={row.original.key}>
              <span className="block font-mono text-sm">
                {row.original.key}
              </span>
            </TextWithTooltip>
          ) : (
            <span className="text-gray-11">—</span>
          ),
      },
      {
        id: 'includeNewPieces',
        size: 160,
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t('Include new pieces')}
            icon={ToggleLeft}
          />
        ),
        cell: ({ row }) => {
          const includesNewPieces =
            row.original.config.pieces.mode === PieceSelectionMode.INCLUDE_ALL;
          return (
            <StatusDot tone={includesNewPieces ? 'success' : 'neutral'}>
              {includesNewPieces ? t('Yes') : t('No')}
            </StatusDot>
          );
        },
      },
      {
        id: 'actions',
        size: 80,
        notClickable: true,
        cell: ({ row }) => (
          <div className="flex justify-end gap-1">
            <RowActionTooltip label={t('Edit Details')}>
              <Button
                {...adminControl(AdminControl.PIECE_SETS_EDIT_OPEN)}
                variant="ghost"
                size="sm"
                aria-label={t('Edit {name}', { name: row.original.name })}
                onClick={() => setEditingSet(row.original)}
              >
                <Settings2 className="size-4" />
              </Button>
            </RowActionTooltip>
            <RowActionTooltip label={t('Duplicate')}>
              <Button
                {...adminControl(AdminControl.PIECE_SETS_DUPLICATE_OPEN)}
                variant="ghost"
                size="sm"
                aria-label={t('Duplicate {name}', { name: row.original.name })}
                onClick={() => setDuplicatingSet(row.original)}
              >
                <Copy className="size-4" />
              </Button>
            </RowActionTooltip>
            <ConfirmDialog
              title={t('Delete {name}?', {
                name: pieceSetName.short(row.original.name),
              })}
              description={t(
                'Projects assigned to this set will be reassigned to the default set.',
              )}
              confirmLabel={t('Delete piece set')}
              controlId={AdminControl.PIECE_SETS_DELETE_CONFIRM}
              onConfirm={() => deleteSet(row.original)}
            >
              <Button
                {...adminControl(AdminControl.PIECE_SETS_DELETE_OPEN)}
                variant="ghost"
                size="sm"
                aria-label={t('Delete {name}', { name: row.original.name })}
                disabled={row.original.isDefault}
              >
                <Trash2 className="size-4 text-danger-11" />
              </Button>
            </ConfirmDialog>
          </div>
        ),
      },
    ],
    [deleteSet, setDuplicatingSet, setEditingSet],
  );

  return (
    <AdminPage>
      <AdminPageHeader
        title={t('Piece Sets')}
        description={t(
          'A piece set decides which pieces (actions/triggers) a project can see. It can also set required actions that a flow must include before it can be published.',
        )}
        resources={adminPageResources.pieces}
      >
        <CreatePieceSetDialog onCreated={() => refetch()} />
      </AdminPageHeader>
      <AdminDataTable
        emptyStateTextTitle={
          platform.plan.managePiecesEnabled
            ? t('No piece sets found')
            : t('No piece sets yet')
        }
        emptyStateTextDescription={
          platform.plan.managePiecesEnabled
            ? t(
                'Create a piece set to control which pieces are available to specific projects',
              )
            : ''
        }
        emptyStateIcon={<Layers />}
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
          next: pieceSetsPage?.next ?? null,
          previous: pieceSetsPage?.previous ?? null,
        }}
        isLoading={isLoading}
        isError={isError}
        errorStateEntity={t('piece sets')}
        onRetry={refetch}
        clientFiltering={true}
        onRowClick={(pieceSet) =>
          navigate(`/platform/pieces/piece-sets/${pieceSet.id}`)
        }
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
    </AdminPage>
  );
};
