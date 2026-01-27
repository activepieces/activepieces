import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import {
  Archive,
  ChevronDown,
  Hourglass,
  Workflow,
  Activity,
  Clock,
  Timer,
  AlertTriangle,
} from 'lucide-react';
import { Dispatch, SetStateAction } from 'react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { RowDataWithActions } from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table/data-table-column-header';
import { TruncatedColumnTextValue } from '@/components/ui/data-table/truncated-column-text-value';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { FormattedDate } from '@/components/ui/formatted-date';
import { StatusIconWithText } from '@/components/ui/status-icon-with-text';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { flowRunUtils } from '@/features/flow-runs/lib/flow-run-utils';
import { formatUtils } from '@/lib/utils';
import { FlowRun, FlowRunStatus, isNil, SeekPage } from '@activepieces/shared';

type SelectedRow = {
  id: string;
  status: FlowRunStatus;
};

type RunsTableColumnsProps = {
  data: SeekPage<FlowRun> | undefined;
  selectedRows: SelectedRow[];
  setSelectedRows: Dispatch<SetStateAction<SelectedRow[]>>;
  selectedAll: boolean;
  setSelectedAll: Dispatch<SetStateAction<boolean>>;
  excludedRows: Set<string>;
  setExcludedRows: Dispatch<SetStateAction<Set<string>>>;
};
export const runsTableColumns = ({
  setSelectedRows,
  selectedRows,
  selectedAll,
  setSelectedAll,
  excludedRows,
  setExcludedRows,
  data,
}: RunsTableColumnsProps): ColumnDef<RowDataWithActions<FlowRun>>[] => [
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
                status: row.original.status,
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
                        status: row.original.status,
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
                        status: row.status,
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
                  setSelectedRows((prev) => [
                    ...prev,
                    {
                      id: row.original.id,
                      status: row.original.status,
                    },
                  ]);
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
    accessorKey: 'flowId',
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={t('Flow')}
        icon={Workflow}
      />
    ),
    cell: ({ row }) => {
      const { archivedAt, flowVersion } = row.original;
      const displayName = flowVersion?.displayName ?? '—';

      return (
        <div className="flex items-center gap-2 text-left">
          {!isNil(archivedAt) && (
            <Archive className="size-4 text-muted-foreground" />
          )}
          <TruncatedColumnTextValue value={displayName} />
        </div>
      );
    },
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
      const duration =
        row.original.startTime && row.original.finishTime
          ? new Date(row.original.finishTime).getTime() -
            new Date(row.original.startTime).getTime()
          : undefined;
      const waitDuration =
        row.original.startTime && row.original.created
          ? new Date(row.original.startTime).getTime() -
            new Date(row.original.created).getTime()
          : undefined;

      return (
        <Tooltip>
          <TooltipTrigger>
            <div className="text-left flex items-center gap-2">
              {row.original.finishTime && (
                <>
                  <Hourglass className="h-4 w-4 text-muted-foreground" />
                  {formatUtils.formatDuration(duration)}
                </>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {t(
              `Time waited before first execution attempt: ${formatUtils.formatDuration(
                waitDuration,
              )}`,
            )}
          </TooltipContent>
        </Tooltip>
      );
    },
  },
  {
    accessorKey: 'failedStep',
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={t('Failed Step')}
        icon={AlertTriangle}
      />
    ),
    cell: ({ row }) => {
      return (
        <div className="text-left">
          {row.original.failedStep?.displayName ?? '-'}
        </div>
      );
    },
  },
];
