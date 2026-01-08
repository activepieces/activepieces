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
  DEFAULT_ESTIMATED_TIME_SAVED_PER_STEP,
  isNil,
  PlatformRole,
} from '@activepieces/shared';

import { EditTimeSavedPopover } from './edit-time-saved-popover';
import { FlowDetailsHeader } from './flow-details-header';

type FlowsDetailsProps = {
  flowsDetails?: AnalyticsFlowReportItem[];
  isLoading: boolean;
  estimatedTimeSavedPerStep?: number | null;
};

type FlowDetailsWithId = AnalyticsFlowReportItem & { id: string };

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
  estimatedTimeSavedPerStep: number,
  isPlatformAdmin: boolean,
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
        {row.original.projectName}
      </div>
    ),
  },
  {
    accessorKey: 'timeSavedPerRun',
    header: ({ column }) => (
      <div className="flex items-center gap-1.5">
        <DataTableColumnHeader
          column={column}
          title={t('Time Saved Per Run')}
        />
        <Tooltip>
          <TooltipTrigger asChild>
            <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            {t(
              'Each completed step saves {minutes} minutes of manual work. You can customize the estimated time saved per step or set a custom value for individual flows.',
              { minutes: Math.round(estimatedTimeSavedPerStep) },
            )}
          </TooltipContent>
        </Tooltip>
      </div>
    ),
    cell: ({ row }) => {
      const timeSavedPerRun = row.original.timeSavedPerRun;
      const displayValue = timeSavedPerRun?.value;
      const isEstimated = timeSavedPerRun?.isEstimated;

      if (!isPlatformAdmin) {
        return (
          <div className="flex items-center gap-1 text-foreground">
            {displayValue == null ? (
              <span>{t('N/A')}</span>
            ) : (
              <span>
                {formatMinutes(Math.round(displayValue ?? 0))}
                {isEstimated && '~'}
              </span>
            )}
          </div>
        );
      }

      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <EditTimeSavedPopover
                flowId={row.original.flowId}
                currentValue={timeSavedPerRun?.value}
              >
                <Button
                  variant="ghost"
                  className="h-auto p-1 gap-1.5 text-foreground hover:bg-accent"
                >
                  <Pencil className="h-3 w-3 text-muted-foreground" />

                  {displayValue == null ? (
                    <span>{t('N/A')}</span>
                  ) : (
                    <span>
                      {formatMinutes(Math.round(displayValue ?? 0))}
                      {isEstimated && '~'}
                    </span>
                  )}
                </Button>
              </EditTimeSavedPopover>
            </div>
          </TooltipTrigger>
          <TooltipContent side="top">
            {t('Click to override the estimation')}
          </TooltipContent>
        </Tooltip>
      );
    },
  },
  {
    accessorKey: 'minutesSaved',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('Total Time Saved')} />
    ),
    cell: ({ row }) => {
      const timeSavedPerRun = row.original.timeSavedPerRun;
      const runs = row.original.runs;
      const minutesSaved = row.original.minutesSaved;
      const isEstimated = timeSavedPerRun.isEstimated;
      const perRunValue = isEstimated
        ? runs > 0
          ? Math.round(minutesSaved / runs)
          : 0
        : timeSavedPerRun.value ?? 0;
      const tooltipText = t(
        'This flow ran {runs} time(s), saving {perRun} minutes per run',
        {
          runs: runs.toLocaleString(),
          perRun: `${isEstimated ? '~' : ''}${perRunValue}`,
        },
      );
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              <span>{formatMinutes(minutesSaved)}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            {tooltipText}
          </TooltipContent>
        </Tooltip>
      );
    },
  },
];

export function FlowsDetails({
  flowsDetails,
  isLoading,
  estimatedTimeSavedPerStep,
}: FlowsDetailsProps) {
  const { timeSavedPerRunOverrides } = useContext(RefreshAnalyticsContext);
  const { data: user } = userHooks.useCurrentUser();
  const isPlatformAdmin = user?.platformRole === PlatformRole.ADMIN;

  const flowsDetailsWithOverrides = useMemo(() => {
    if (!flowsDetails) return undefined;

    return flowsDetails.map((flow) => {
      const override = timeSavedPerRunOverrides[flow.flowId];
      if (override === undefined) {
        return flow;
      }

      const newValue = override.value;
      return {
        ...flow,
        timeSavedPerRun: {
          value: newValue,
          isEstimated: isNil(newValue),
        },
        minutesSaved:
          newValue !== null ? newValue * flow.runs : flow.minutesSaved,
      };
    });
  }, [flowsDetails, timeSavedPerRunOverrides]);

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

  const resolvedEstimatedTimeSavedPerStep = isNil(estimatedTimeSavedPerStep)
    ? DEFAULT_ESTIMATED_TIME_SAVED_PER_STEP
    : estimatedTimeSavedPerStep;

  const columns = createColumns(
    resolvedEstimatedTimeSavedPerStep,
    isPlatformAdmin,
  );

  return (
    <div className="flex flex-col gap-4 mb-8">
      <FlowDetailsHeader flowsDetails={flowsDetailsWithOverrides} />
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
