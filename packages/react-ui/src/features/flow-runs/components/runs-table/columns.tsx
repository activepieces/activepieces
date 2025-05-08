import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import { ChevronDown } from 'lucide-react';
import { Dispatch, SetStateAction } from 'react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { RowDataWithActions } from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table/data-table-column-header';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { StatusIconWithText } from '@/components/ui/status-icon-with-text';
import { flowRunUtils } from '@/features/flow-runs/lib/flow-run-utils';
import { formatUtils } from '@/lib/utils';
import { FlowRun, FlowRunStatus, SeekPage } from '@activepieces/shared';

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
    header: ({ table }) => (
      <div className="flex items-center">
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
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
      );
    },
  },
  {
    accessorKey: 'flowId',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('Flow')} />
    ),
    cell: ({ row }) => {
      return <div className="text-left">{row.original.flowDisplayName}</div>;
    },
  },
  {
    accessorKey: 'status',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('Status')} />
    ),
    cell: ({ row }) => {
      const status = row.original.status;
      const { variant, Icon } = flowRunUtils.getStatusIcon(status);
      return (
        <div className="text-left">
          <StatusIconWithText
            icon={Icon}
            text={formatUtils.convertEnumToHumanReadable(status)}
            variant={variant}
          />
        </div>
      );
    },
  },
  {
    accessorKey: 'created',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('Start Time')} />
    ),
    cell: ({ row }) => {
      return (
        <div className="text-left">
          {formatUtils.formatDate(new Date(row.original.startTime))}
        </div>
      );
    },
  },
  {
    accessorKey: 'duration',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('Duration')} />
    ),
    cell: ({ row }) => {
      return (
        <div className="text-left">
          {row.original.finishTime &&
            formatUtils.formatDuration(row.original.duration)}
        </div>
      );
    },
  },
];
