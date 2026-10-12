import { PieceMetadataModelSummary } from '@activepieces/pieces-framework';
import { isPieceVisible, PieceSet } from '@activepieces/shared';
import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import {
  CheckIcon,
  GitBranch,
  Hash,
  Package,
  Puzzle,
  SlidersHorizontal,
} from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { DataTable, RowDataWithActions } from '@/components/custom/data-table';
import { DataTableColumnHeader } from '@/components/custom/data-table/data-table-column-header';
import { DataTableSelectPopover } from '@/components/custom/data-table/data-table-select-popover';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { pieceSetMutations } from '@/features/piece-sets';
import { PieceIcon, piecesHooks } from '@/features/pieces';
import { AdminControl, adminControl } from '@/lib/admin-control';
import { cn } from '@/lib/utils';

import { ConfirmExcludingRequiredActionsDialog } from './confirm-excluding-required-actions';
import { PieceActionsAndTriggersSheet } from './piece-actions-and-triggers-sheet';
import { BulkPieceSetActions } from './piece-set-bulk-actions';
import { pieceSetInclusionUtils } from './piece-set-inclusion-utils';

export const PieceSetPiecesTable = ({ pieceSet }: PieceSetPiecesTableProps) => {
  const { pieces, isLoading, isError, refetch } = piecesHooks.usePieces({
    includeHidden: true,
    isTableQuery: true,
    skipProjectFilter: true,
  });
  const { mutate: updateSet } = pieceSetMutations.useUpdatePieceSet();
  const [selectedStatuses, setSelectedStatuses] = useState(new Set<string>());
  const [managingComponentsPiece, setManagingComponentsPiece] = useState<
    string | null
  >(null);

  const [pieceToConfirmExcluding, setPieceToConfirmExcluding] = useState<
    string | null
  >(null);

  const togglePiece = useCallback(
    (pieceName: string) => {
      const included = isPieceVisible({
        pieces: pieceSet.config.pieces,
        name: pieceName,
      });
      const request = {
        pieces: pieceSetInclusionUtils.setPiecesIncluded({
          pieces: pieceSet.config.pieces,
          pieceNames: [pieceName],
          included: !included,
        }),
      };
      if (
        included &&
        pieceSetInclusionUtils.hasExcludedRequiredActions({ pieceSet, request })
      ) {
        setPieceToConfirmExcluding(pieceName);
        return;
      }
      updateSet({ id: pieceSet.id, request });
    },
    [updateSet, pieceSet],
  );
  const excludePieceRequestToConfirm = pieceToConfirmExcluding
    ? {
        pieces: pieceSetInclusionUtils.setPiecesIncluded({
          pieces: pieceSet.config.pieces,
          pieceNames: [pieceToConfirmExcluding],
          included: false,
        }),
      }
    : null;

  const filteredPieces = useMemo(() => {
    const allPieces = pieces ?? [];
    if (selectedStatuses.size === 0) return allPieces;
    return allPieces.filter((piece) => {
      const included = isPieceVisible({
        pieces: pieceSet.config.pieces,
        name: piece.name,
      });
      return selectedStatuses.has(included ? 'enabled' : 'disabled');
    });
  }, [pieces, pieceSet, selectedStatuses]);

  const columns: ColumnDef<RowDataWithActions<PieceMetadataModelSummary>>[] =
    useMemo(
      () => [
        {
          accessorKey: 'displayName',
          size: 300,
          header: ({ column }) => (
            <DataTableColumnHeader
              column={column}
              title={t('Name')}
              icon={Puzzle}
            />
          ),
          cell: ({ row }) => {
            return (
              <div className="flex items-center gap-2">
                <PieceIcon
                  size={'sm'}
                  border={true}
                  displayName={row.original.displayName}
                  logoUrl={row.original.logoUrl}
                  showTooltip={false}
                />
                <span>{row.original.displayName}</span>
              </div>
            );
          },
        },
        {
          accessorKey: 'packageName',
          size: 250,
          header: ({ column }) => (
            <DataTableColumnHeader
              column={column}
              title={t('Package Name')}
              icon={Hash}
            />
          ),
          cell: ({ row }) => (
            <div className="text-left">{row.original.name}</div>
          ),
        },
        {
          accessorKey: 'version',
          size: 80,
          header: ({ column }) => (
            <DataTableColumnHeader
              column={column}
              title={t('Version')}
              icon={GitBranch}
            />
          ),
          cell: ({ row }) => (
            <div className="text-left">{row.original.version}</div>
          ),
        },
        {
          id: 'actionsAndTriggers',
          size: 240,
          header: ({ column }) => (
            <DataTableColumnHeader
              column={column}
              title={t('Actions & triggers')}
              icon={SlidersHorizontal}
            />
          ),
          cell: ({ row }) => {
            const included = isPieceVisible({
              pieces: pieceSet.config.pieces,
              name: row.original.name,
            });
            const selectedActions =
              pieceSet.config.selectedActions[row.original.name];
            const selectedTriggers =
              pieceSet.config.selectedTriggers[row.original.name];
            const curated =
              row.original.name in pieceSet.config.selectedActions ||
              row.original.name in pieceSet.config.selectedTriggers;
            const total = row.original.actions + row.original.triggers;
            const selectedCount =
              (selectedActions?.length ?? row.original.actions) +
              (selectedTriggers?.length ?? row.original.triggers);
            const requiredCount =
              pieceSet.config.requiredActions.actions[row.original.name]
                ?.length ?? 0;
            return (
              <div className="flex items-center gap-1.5">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      {...adminControl(
                        included
                          ? AdminControl.PIECE_SETS_COMPONENTS_OPEN
                          : undefined,
                      )}
                      type="button"
                      className={cn(
                        'cursor-pointer',
                        !included && 'opacity-50',
                      )}
                    >
                      <Badge variant="accent">
                        {curated
                          ? t('{count} of {total} included', {
                              count: selectedCount,
                              total,
                            })
                          : t('All actions')}
                      </Badge>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {t('Manage actions & triggers')}
                  </TooltipContent>
                </Tooltip>
                {requiredCount > 0 && (
                  <Badge variant="outline">
                    {t('requiredCount', { count: requiredCount })}
                  </Badge>
                )}
              </div>
            );
          },
        },
        {
          id: 'actions',
          size: 80,
          notClickable: true,
          cell: ({ row }) => {
            const included = isPieceVisible({
              pieces: pieceSet.config.pieces,
              name: row.original.name,
            });
            return (
              <div className="flex items-center justify-end">
                <Switch
                  {...adminControl(AdminControl.PIECE_SETS_PIECE_TOGGLE)}
                  checked={included}
                  onCheckedChange={() => togglePiece(row.original.name)}
                />
              </div>
            );
          },
        },
      ],
      [pieceSet, togglePiece],
    );

  const openPieceOrPromptInclude = (piece: PieceMetadataModelSummary) => {
    const isIncluded = isPieceVisible({
      pieces: pieceSet.config.pieces,
      name: piece.name,
    });
    if (isIncluded) {
      setManagingComponentsPiece(piece.name);
      return;
    }
    const message = t('To edit {name}, include it in the set first.', {
      name: piece.displayName,
    });
    toast(message, {
      action: {
        label: t('Include'),
        onClick: () => togglePiece(piece.name),
      },
    });
  };

  const managingPieceDisplayName = useMemo(
    () =>
      pieces?.find((p) => p.name === managingComponentsPiece)?.displayName ??
      managingComponentsPiece ??
      '',
    [pieces, managingComponentsPiece],
  );

  return (
    <>
      <DataTable
        emptyStateTextTitle={t('No pieces found')}
        emptyStateTextDescription={t(
          'Start by installing pieces that you want to use in your automations',
        )}
        emptyStateIcon={<Package className="size-14" />}
        columns={columns}
        filters={[
          {
            type: 'input',
            title: t('Piece Name'),
            accessorKey: 'displayName',
            icon: CheckIcon,
          },
        ]}
        customFilters={[
          <DataTableSelectPopover
            key="status-filter"
            title={t('Status')}
            selectedValues={new Set(selectedStatuses)}
            options={[
              { label: t('Enabled'), value: 'enabled' },
              { label: t('Disabled'), value: 'disabled' },
            ]}
            handleFilterChange={(values) =>
              setSelectedStatuses(new Set(values))
            }
          />,
        ]}
        page={{
          data: filteredPieces,
          next: null,
          previous: null,
        }}
        isLoading={isLoading}
        isError={isError}
        errorStateEntity={t('pieces')}
        onRetry={refetch}
        clientFiltering={true}
        bulkActions={[
          {
            render: (selectedRows, resetSelection) => (
              <BulkPieceSetActions
                pieceSet={pieceSet}
                selectedPieces={selectedRows}
                resetSelection={resetSelection}
              />
            ),
          },
        ]}
        selectColumn={true}
        getRowId={(piece) => piece.name}
        onRowClick={openPieceOrPromptInclude}
        virtualizeRows={true}
        hidePagination={true}
      />
      {managingComponentsPiece && (
        <PieceActionsAndTriggersSheet
          pieceName={managingComponentsPiece}
          pieceDisplayName={managingPieceDisplayName}
          open={true}
          onOpenChange={(open) => {
            if (!open) setManagingComponentsPiece(null);
          }}
          pieceSet={pieceSet}
        />
      )}
      <ConfirmExcludingRequiredActionsDialog
        excludedRequiredActions={
          excludePieceRequestToConfirm
            ? pieceSetInclusionUtils.findExcludedRequiredActions({
                pieceSet,
                request: excludePieceRequestToConfirm,
              })
            : null
        }
        reason="removePieces"
        onConfirm={() => {
          setPieceToConfirmExcluding(null);
          if (excludePieceRequestToConfirm) {
            updateSet({
              id: pieceSet.id,
              request: excludePieceRequestToConfirm,
            });
          }
        }}
        onCancel={() => setPieceToConfirmExcluding(null)}
      />
    </>
  );
};

type PieceSetPiecesTableProps = {
  pieceSet: PieceSet;
};
