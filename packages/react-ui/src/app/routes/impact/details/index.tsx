import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import { Clock, Info, LayoutGrid, Pencil, User, Workflow } from 'lucide-react';
import { useContext, useMemo } from 'react';

import { ApAvatar } from '@/components/custom/ap-avatar';
import { Button } from '@/components/ui/button';
import { DataTable, RowDataWithActions } from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table/data-table-column-header';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { RefreshAnalyticsContext } from '@/features/platform-admin/lib/refresh-analytics-context';
import { userHooks } from '@/hooks/user-hooks';
import {
  AnalyticsFlowReportItem,
  isNil,
  PlatformRole,
  PlatformAnalyticsReport,
} from '@activepieces/shared';

import { EditTimeSavedPopover } from './edit-time-saved-popover';
import { FlowDetailsHeader } from './flow-details-header';
import { formatUtils } from '@/lib/utils';

type FlowsDetailsProps = {
  report?: PlatformAnalyticsReport;
  isLoading: boolean;
};

type FlowDetailsWithId = PlatformAnalyticsReport['flows'][number] & { id: string };

const formatMinutes = (minutes: number) => {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${remainingMinutes}m`;
};

const createColumns = (
  isPlatformAdmin: boolean,
  report?: PlatformAnalyticsReport,
): ColumnDef<RowDataWithActions<FlowDetailsWithId>>[] => [
  {
    accessorKey: 'flowName',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('Flow')} />
    ),
    cell: ({ row }) => (
      <div
        className="flex items-center gap-1 text-foreground hover:underline cursor-pointer"
        onClick={() =>
          window.open(
            `/projects/${row.original.projectId}/flows/${row.original.flowId}`,
            '_blank',
          )
        }
      >
        <Workflow className="h-3.5 w-3.5" />
        {row.original.flowName}
      </div>
    ),
  },
  {
    accessorKey: 'owner',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('Owner')} icon={User} />
    ),
    cell: ({ row }) => {
      return (
        <ApAvatar
          id={row.original.ownerId ?? ''}
          size="small"
          includeAvatar={true}
          includeName={true}
        />
      );
    },
  },
  {
    accessorKey: 'projectName',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('Project')} />
    ),
    cell: ({ row }) => (
      <div
        className="flex items-center gap-1 text-foreground hover:underline cursor-pointer"
        onClick={() =>
          window.open(`/projects/${row.original.projectId}`, '_blank')
        }
      >
        <LayoutGrid className="h-3.5 w-3.5" />
        {row.original.projectId}
      </div>
    ),
  },
  {
    accessorKey: 'minutesSaved',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('Total Time Saved')} />
    ),
    cell: ({ row }) => {
      const timeSavedPerRun = row.original.timeSavedPerRun;
      const runs = (report?.runs.find(run => run.flowId === row.original.flowId)?.runs ?? 0) * (row.original.timeSavedPerRun ?? 0);
      const minutesSaved = runs;
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              <span>{formatMinutes(minutesSaved)}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            {t('This flow ran {runs} time(s), saving {minutesSaved} minutes per run', {
              runs: runs.toLocaleString(),
              minutesSaved: formatUtils.formatToHoursAndMinutes(timeSavedPerRun ?? 0),
            })}
          </TooltipContent>
        </Tooltip>
      );
    },
  },
];

export function FlowsDetails({
  report,
  isLoading,
}: FlowsDetailsProps) {
  const { data: user } = userHooks.useCurrentUser();
  const isPlatformAdmin = user?.platformRole === PlatformRole.ADMIN;

  const flowsDetailsWithOverrides = useMemo(() => {
    if (!report) return undefined;

    return report.flows.map((flow) => {
      return {
        ...flow,
        runs: report.runs.find(run => run.flowId === flow.flowId)?.runs ?? 0,
        minutesSaved: (flow.timeSavedPerRun ?? 0) * (report.runs.find(run => run.flowId === flow.flowId)?.runs ?? 0),
      };
    });
  }, [report]);

  if (!flowsDetailsWithOverrides && !isLoading) {
    return null;
  }

  const dataWithIds: FlowDetailsWithId[] =
    flowsDetailsWithOverrides
      ?.map((flow) => ({
        ...flow,
        id: flow.flowId,
      }))
      .sort((a, b) => b.minutesSaved - a.minutesSaved) ?? [];

  const columns = createColumns(isPlatformAdmin, report);

  return (
    <div className="flex flex-col gap-4 mb-8">
      <FlowDetailsHeader report={report} />
      <DataTable
        columns={columns}
        page={{
          data: dataWithIds,
          next: null,
          previous: null,
        }}
        isLoading={isLoading}
        hidePagination={true}
        emptyStateTextTitle={t('No Runs Yet')}
        emptyStateTextDescription={t(
          'Start running your flows to see time saved',
        )}
        emptyStateIcon={
          <Workflow className="h-10 w-10 text-muted-foreground" />
        }
      />
    </div>
  );
}
