import { isNil, SeekPage } from '@activepieces/core-utils';
import {
  PieceRunKind,
  PieceRunListItem,
  PieceRunSource,
  FlowActionType,
  FlowRunStatus,
  isFailedState,
} from '@activepieces/shared';
import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import {
  Activity,
  AlertTriangle,
  Archive,
  ChevronDown,
  Clock,
  Puzzle,
  Radio,
  Timer,
  User,
} from 'lucide-react';
import { Dispatch, SetStateAction } from 'react';

import { RowDataWithActions } from '@/components/custom/data-table';
import { DataTableColumnHeader } from '@/components/custom/data-table/data-table-column-header';
import { TruncatedColumnTextValue } from '@/components/custom/data-table/truncated-column-text-value';
import { FormattedDate } from '@/components/custom/formatted-date';
import { StatusIconWithText } from '@/components/custom/status-icon-with-text';
import { UserAvatar } from '@/components/custom/user-avatar';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { flowRunUtils } from '@/features/flow-runs/utils/flow-run-utils';
import { PieceIcon, PieceIconWithPieceName } from '@/features/pieces';
import { piecesHooks } from '@/features/pieces/hooks/pieces-hooks';
import { CORE_STEP_METADATA } from '@/features/pieces/utils/step-utils';
import { formatUtils } from '@/lib/format-utils';

function PieceCell({ run }: { run: PieceRunListItem }) {
  const { kind, actionName, pieceName, archivedAt } = run;
  const { pieceModel } = piecesHooks.usePiece({
    name: pieceName ?? '',
    enabled: kind === PieceRunKind.PIECE && !isNil(pieceName),
  });

  if (kind === PieceRunKind.CODE) {
    return (
      <div className="flex items-center gap-2 text-left min-w-0">
        {!isNil(archivedAt) && (
          <Archive className="size-4 shrink-0 text-muted-foreground" />
        )}
        <div className="shrink-0">
          <PieceIcon
            size="sm"
            border={true}
            showTooltip={false}
            displayName={t('Code')}
            logoUrl={CORE_STEP_METADATA[FlowActionType.CODE].logoUrl}
          />
        </div>
        <TruncatedColumnTextValue value={t('Code')} />
      </div>
    );
  }

  const pieceLabel = pieceModel?.displayName ?? pieceName ?? '—';
  const actionLabel = isNil(actionName)
    ? undefined
    : pieceModel?.actions?.[actionName]?.displayName ?? actionName;

  const primaryLabel = actionLabel ?? pieceLabel;
  const secondaryLabel = isNil(actionLabel) ? undefined : pieceLabel;

  return (
    <div className="flex items-center gap-2 text-left min-w-0">
      {!isNil(archivedAt) && (
        <Archive className="size-4 shrink-0 text-muted-foreground" />
      )}
      {!isNil(pieceName) && (
        <div className="shrink-0">
          <PieceIconWithPieceName
            pieceName={pieceName}
            size="sm"
            showTooltip={false}
          />
        </div>
      )}
      <div className="flex flex-col gap-0.5 text-left min-w-0">
        <TruncatedColumnTextValue value={primaryLabel} />
        {!isNil(secondaryLabel) && (
          <span className="text-xs text-muted-foreground truncate">
            {secondaryLabel}
          </span>
        )}
      </div>
    </div>
  );
}

export const pieceRunsColumns = ({
  selectedRows,
  setSelectedRows,
  selectedAll,
  setSelectedAll,
  excludedRows,
  setExcludedRows,
  data,
}: PieceRunsColumnsProps): ColumnDef<
  RowDataWithActions<PieceRunListItem>
>[] => [
  {
    id: 'select',
    accessorKey: 'select',
    size: 40,
    minSize: 40,
    maxSize: 40,
    header: ({ table }) => (
      <div className="flex items-center h-full relative">
        <Checkbox
          checked={selectedAll || table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => {
            const isChecked = !!value;
            table.toggleAllPageRowsSelected(isChecked);

            if (isChecked) {
              const currentPageRows = table.getRowModel().rows.map((row) => ({
                id: row.original.id,
              }));

              setSelectedRows((prev) => {
                const uniqueRows = new Map<string, SelectedRow>([
                  ...prev.map((row) => [row.id, row] as [string, SelectedRow]),
                  ...currentPageRows.map(
                    (row) => [row.id, row] as [string, SelectedRow],
                  ),
                ]);

                return Array.from(uniqueRows.values());
              });
            } else {
              setSelectedAll(false);
              setSelectedRows([]);
              setExcludedRows(new Set());
            }
          }}
        />
        {selectedRows.length > 0 && (
          <div className="absolute left-5">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="xs">
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="z-50">
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => {
                    const currentPageRows = table
                      .getRowModel()
                      .rows.map((row) => ({
                        id: row.original.id,
                      }));
                    setSelectedRows(currentPageRows);
                    setSelectedAll(false);
                    setExcludedRows(new Set());
                    table.toggleAllPageRowsSelected(true);
                  }}
                >
                  {t('Select shown')}
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => {
                    if (data?.data) {
                      const allRows = data.data.map((row) => ({
                        id: row.id,
                      }));
                      setSelectedRows(allRows);
                      setSelectedAll(true);
                      setExcludedRows(new Set());
                      table.toggleAllPageRowsSelected(true);
                    }
                  }}
                >
                  {t('Select all')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    ),
    cell: ({ row }) => {
      const isExcluded = excludedRows.has(row.original.id);
      const isSelected = selectedAll
        ? !isExcluded
        : selectedRows.some(
            (selectedRow) => selectedRow.id === row.original.id,
          );

      return (
        <div className="flex items-center h-full">
          <Checkbox
            checked={isSelected}
            onCheckedChange={(value) => {
              const isChecked = !!value;
              if (selectedAll) {
                if (isChecked) {
                  const newExcluded = new Set(excludedRows);
                  newExcluded.delete(row.original.id);
                  setExcludedRows(newExcluded);
                } else {
                  setExcludedRows(new Set([...excludedRows, row.original.id]));
                }
              } else {
                if (isChecked) {
                  setSelectedRows((prev) => [...prev, { id: row.original.id }]);
                } else {
                  setSelectedRows((prev) =>
                    prev.filter(
                      (selectedRow) => selectedRow.id !== row.original.id,
                    ),
                  );
                }
              }
              row.toggleSelected(isChecked);
            }}
          />
        </div>
      );
    },
  },
  {
    accessorKey: 'piece',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('Piece')} icon={Puzzle} />
    ),
    cell: ({ row }) => <PieceCell run={row.original} />,
  },
  {
    accessorKey: 'status',
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={t('Status')}
        icon={Activity}
      />
    ),
    cell: ({ row }) => {
      const status = row.original.status;
      const { variant, Icon } = flowRunUtils.getStatusIcon(status);
      return (
        <div className="text-left">
          <StatusIconWithText
            icon={Icon}
            text={formatUtils.convertEnumToReadable(status)}
            variant={variant}
          />
        </div>
      );
    },
  },
  {
    accessorKey: 'source',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('Source')} icon={Radio} />
    ),
    cell: ({ row }) => {
      return (
        <div className="text-left">
          <TruncatedColumnTextValue value={formatSource(row.original.source)} />
        </div>
      );
    },
  },
  {
    accessorKey: 'user',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('Run By')} icon={User} />
    ),
    cell: ({ row }) => {
      const { userName, userEmail, userImageUrl } = row.original;
      if (isNil(userName)) {
        return <div className="text-left">—</div>;
      }
      return (
        <div className="flex items-center gap-2 text-left min-w-0">
          <div className="shrink-0">
            <UserAvatar
              name={userName}
              email={userEmail ?? ''}
              imageUrl={userImageUrl}
              size={24}
              disableTooltip
            />
          </div>
          <TruncatedColumnTextValue value={userName} />
        </div>
      );
    },
  },
  {
    accessorKey: 'created',
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={t('Started At')}
        icon={Clock}
      />
    ),
    cell: ({ row }) => {
      return (
        <div className="text-left">
          <FormattedDate
            date={new Date(row.original.created ?? new Date())}
            className="text-left"
            includeTime={true}
          />
        </div>
      );
    },
  },
  {
    accessorKey: 'duration',
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={t('Duration')}
        icon={Timer}
      />
    ),
    cell: ({ row }) => {
      const { startTime, finishTime } = row.original;
      const duration =
        startTime && finishTime
          ? new Date(finishTime).getTime() - new Date(startTime).getTime()
          : undefined;
      return (
        <div className="text-left flex items-center gap-2">
          {finishTime && <span>{formatUtils.formatDuration(duration)}</span>}
          {!finishTime && <span>—</span>}
        </div>
      );
    },
  },
  {
    accessorKey: 'failure',
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={t('Failure')}
        icon={AlertTriangle}
      />
    ),
    cell: ({ row }) => {
      const { errorMessage, status } = row.original;
      const failed = isFailedState(status as FlowRunStatus);
      if (!failed || isNil(errorMessage)) {
        return <div className="text-left">—</div>;
      }
      return (
        <div className="text-left">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => e.stopPropagation()}
              >
                {t('View error')}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs break-words">
              {errorMessage}
            </TooltipContent>
          </Tooltip>
        </div>
      );
    },
  },
];

export function formatSource(source: string): string {
  if (source === PieceRunSource.MCP || source === PieceRunSource.API) {
    return source;
  }
  return formatUtils.convertEnumToReadable(source);
}

type SelectedRow = {
  id: string;
};

type PieceRunsColumnsProps = {
  data: SeekPage<PieceRunListItem> | undefined;
  selectedRows: SelectedRow[];
  setSelectedRows: Dispatch<SetStateAction<SelectedRow[]>>;
  selectedAll: boolean;
  setSelectedAll: Dispatch<SetStateAction<boolean>>;
  excludedRows: Set<string>;
  setExcludedRows: Dispatch<SetStateAction<Set<string>>>;
};
