import { PieceMetadataModelSummary } from '@activepieces/pieces-framework';
import { PieceSet } from '@activepieces/shared';
import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import {
  CheckIcon,
  EyeOff,
  Eye,
  GitBranch,
  Hash,
  Package,
  Puzzle,
  SlidersHorizontal,
} from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';

import { DataTable, RowDataWithActions } from '@/components/custom/data-table';
import { DataTableColumnHeader } from '@/components/custom/data-table/data-table-column-header';
import { DataTableSelectPopover } from '@/components/custom/data-table/data-table-select-popover';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { pieceSetMutations } from '@/features/piece-sets';
import { PieceIcon, piecesHooks } from '@/features/pieces';
import { cn } from '@/lib/utils';

import { PieceComponentVisibilitySheet } from '../piece-component-visibility-sheet';

type PieceSetPiecesTabProps = {
  pieceSet: PieceSet;
};

const BulkPieceSetActions = ({
  pieceSet,
  selectedPieces,
  resetSelection,
}: {
  pieceSet: PieceSet;
  selectedPieces: PieceMetadataModelSummary[];
  resetSelection: () => void;
}) => {
  const {
    mutate: updateSet,
    isPending,
    variables,
  } = pieceSetMutations.useUpdatePieceSet();

  const selectedNames = selectedPieces.map((p) => p.name);
  const allIncluded = selectedPieces.every(
    (p) => !pieceSet.config.disabledPieces.includes(p.name),
  );
  const allExcluded = selectedPieces.every((p) =>
    pieceSet.config.disabledPieces.includes(p.name),
  );

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        loading={
          isPending &&
          !!(variables as { request: { enablePieces?: string[] } })?.request
            ?.enablePieces
        }
        disabled={allIncluded}
        onClick={() =>
          updateSet(
            { id: pieceSet.id, request: { enablePieces: selectedNames } },
            { onSuccess: resetSelection },
          )
        }
      >
        <Eye className="mr-1 size-4" />
        {t('Include')}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        loading={
          isPending &&
          !!(variables as { request: { disablePieces?: string[] } })?.request
            ?.disablePieces
        }
        disabled={allExcluded}
        onClick={() =>
          updateSet(
            { id: pieceSet.id, request: { disablePieces: selectedNames } },
            { onSuccess: resetSelection },
          )
        }
      >
        <EyeOff className="mr-1 size-4" />
        {t('Exclude')}
      </Button>
    </>
  );
};

export const PieceSetPiecesTab = ({ pieceSet }: PieceSetPiecesTabProps) => {
  const { pieces, isLoading } = piecesHooks.usePieces({
    includeHidden: false,
    isTableQuery: true,
    skipProjectFilter: true,
  });
  const { mutate: updateSet, isPending } =
    pieceSetMutations.useUpdatePieceSet();
  const [selectedStatuses, setSelectedStatuses] = useState(new Set<string>());
  const [managingComponentsPiece, setManagingComponentsPiece] = useState<
    string | null
  >(null);

  const togglePiece = useCallback(
    (pieceName: string, currentlyIncluded: boolean) => {
      if (currentlyIncluded) {
        updateSet({ id: pieceSet.id, request: { disablePieces: [pieceName] } });
      } else {
        updateSet({ id: pieceSet.id, request: { enablePieces: [pieceName] } });
      }
    },
    [updateSet, pieceSet.id],
  );

  const filteredPieces = useMemo(() => {
    const allPieces = pieces ?? [];
    if (selectedStatuses.size === 0) return allPieces;
    return allPieces.filter((piece) => {
      const included = !pieceSet.config.disabledPieces.includes(piece.name);
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
          cell: ({ row }) => (
            <div className="flex items-center gap-2">
              <PieceIcon
                size={'sm'}
                border={true}
                displayName={row.original.displayName}
                logoUrl={row.original.logoUrl}
                showTooltip={false}
              />
              <div className="flex flex-col gap-0.5">
                <span>{row.original.displayName}</span>
                {row.original.tags && row.original.tags.length > 0 && (
                  <div className="flex gap-1">
                    {row.original.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className="text-xs py-0 px-1.5"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ),
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
          id: 'actions',
          size: 120,
          cell: ({ row }) => {
            const included = !pieceSet.config.disabledPieces.includes(
              row.original.name,
            );
            const hasComponentFilters =
              !!pieceSet.config.disabledActions[row.original.name]?.length ||
              !!pieceSet.config.disabledTriggers[row.original.name]?.length;
            return (
              <div className="flex items-center justify-end gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={!included}
                      onClick={() =>
                        setManagingComponentsPiece(row.original.name)
                      }
                    >
                      <SlidersHorizontal
                        className={cn(
                          'size-4',
                          hasComponentFilters && 'text-primary',
                        )}
                      />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {t('Manage actions & triggers')}
                  </TooltipContent>
                </Tooltip>
                <Switch
                  checked={included}
                  disabled={isPending}
                  onCheckedChange={() =>
                    togglePiece(row.original.name, included)
                  }
                />
              </div>
            );
          },
        },
      ],
      [pieceSet, togglePiece, isPending],
    );

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
        virtualizeRows={true}
        hidePagination={true}
      />
      {managingComponentsPiece && (
        <PieceComponentVisibilitySheet
          pieceName={managingComponentsPiece}
          pieceDisplayName={managingPieceDisplayName}
          open={true}
          onOpenChange={(open) => {
            if (!open) setManagingComponentsPiece(null);
          }}
          pieceSet={pieceSet}
        />
      )}
    </>
  );
};
