import { isNil, SeekPage } from '@activepieces/core-utils';
import { FlowRun, FlowRunStatus } from '@activepieces/shared';
import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import { Archive, ChevronDown } from 'lucide-react';
import { Dispatch, SetStateAction } from 'react';

import { RowDataWithActions } from '@/components/custom/data-table';
import { DataTableColumnHeader } from '@/components/custom/data-table/data-table-column-header';
import { FormattedDate } from '@/components/custom/formatted-date';
import { StatusDot } from '@/components/custom/status-dot';
import { StatusVariant } from '@/components/custom/status-icon-with-text';
import { TextWithTooltip } from '@/components/custom/text-with-tooltip';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  TimelineBar,
  isTimelineEmpty,
} from '@/features/flow-runs/components/timeline-bar';
import { flowRunUtils } from '@/features/flow-runs/utils/flow-run-utils';
import { formatUtils } from '@/lib/format-utils';

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
  onViewError: (run: FlowRun) => void;
  onViewRun: (run: FlowRun) => void;
  canViewInternalError: boolean;
};
export const runsTableColumns = ({
  setSelectedRows,
  selectedRows,
  selectedAll,
  setSelectedAll,
  excludedRows,
  setExcludedRows,
  data,
  onViewError,
  onViewRun,
  canViewInternalError,
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
                  <ChevronDown className="size-4" />
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
      <DataTableColumnHeader column={column} title={t('Run')} />
    ),
    cell: ({ row }) => {
      const { archivedAt, flowVersion, failedStep } = row.original;
      const displayName = flowVersion?.displayName ?? '—';
      const failedAt = failedStep?.displayName;

      return (
        <div className="flex min-w-0 items-center gap-2 text-left">
          {!isNil(archivedAt) && (
            <Archive
              aria-label={t('Archived')}
              className="size-4 shrink-0 text-gray-11"
            />
          )}
          <div className="flex min-w-0 items-baseline gap-2">
            <TextWithTooltip tooltipMessage={displayName}>
              <span className="max-w-full shrink-0 truncate font-medium text-gray-12">
                {displayName}
              </span>
            </TextWithTooltip>
            {failedAt && (
              <TextWithTooltip
                tooltipMessage={t('Failed at {stepName}', {
                  stepName: failedAt,
                })}
              >
                <span className="min-w-0 truncate text-gray-11">
                  {t('Failed at {stepName}', { stepName: failedAt })}
                </span>
              </TextWithTooltip>
            )}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: 'status',
    size: 176,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('Status')} />
    ),
    cell: ({ row }) => {
      const status = row.original.status;
      const { variant } = flowRunUtils.getStatusIcon(status);
      return (
        <StatusDot
          tone={STATUS_TONES[variant]}
          pulse={status === FlowRunStatus.RUNNING}
        >
          {flowRunUtils.getStatusLabelOverride(status) ??
            formatUtils.convertEnumToReadable(status)}
        </StatusDot>
      );
    },
  },
  {
    accessorKey: 'duration',
    size: 128,
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={t('Duration')}
        className="justify-end"
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

      const durationValue = (
        <span className="text-gray-12 tabular-nums">
          {row.original.finishTime
            ? formatUtils.formatDuration(duration, true)
            : '—'}
        </span>
      );

      if (!isTimelineEmpty(row.original.timeline)) {
        return (
          <div className="flex justify-end">
            <HoverCard openDelay={200} closeDelay={100}>
              <HoverCardTrigger asChild>{durationValue}</HoverCardTrigger>
              <HoverCardContent className="w-[28rem] p-3">
                <TimelineBar timeline={row.original.timeline} />
              </HoverCardContent>
            </HoverCard>
          </div>
        );
      }

      return (
        <div className="flex justify-end">
          <Tooltip>
            <TooltipTrigger asChild>{durationValue}</TooltipTrigger>
            <TooltipContent side="bottom">
              {t('Waited {duration} before the first attempt', {
                duration: formatUtils.formatDuration(waitDuration, true),
              })}
            </TooltipContent>
          </Tooltip>
        </div>
      );
    },
  },
  {
    accessorKey: 'created',
    size: 176,
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={t('Started')}
        className="justify-end"
      />
    ),
    cell: ({ row }) => {
      return (
        <div className="flex justify-end">
          <FormattedDate
            date={new Date(row.original.created ?? new Date())}
            className="text-gray-11 tabular-nums"
            includeTime={true}
          />
        </div>
      );
    },
  },
  {
    accessorKey: 'failedStep',
    size: 128,
    header: () => <span className="sr-only">{t('Error')}</span>,
    cell: ({ row }) => {
      const { failedStep, status } = row.original;
      const canOpenInternalError =
        isNil(failedStep) &&
        status === FlowRunStatus.INTERNAL_ERROR &&
        canViewInternalError;
      if (isNil(failedStep) && !canOpenInternalError) {
        return null;
      }
      return (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              if (canOpenInternalError || failedStep?.message) {
                onViewError(row.original);
              } else {
                onViewRun(row.original);
              }
            }}
          >
            {t('View error')}
          </Button>
        </div>
      );
    },
  },
];

const STATUS_TONES: Record<
  StatusVariant,
  'success' | 'warning' | 'danger' | 'accent' | 'neutral'
> = {
  success: 'success',
  error: 'danger',
  warning: 'warning',
  primary: 'accent',
  neutral: 'neutral',
  default: 'neutral',
  secondary: 'neutral',
};
