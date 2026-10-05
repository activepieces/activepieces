import {
  PlatformAnalyticsReport,
  PROJECT_COLOR_PALETTE,
  ProjectType,
  ProjectWithLimits,
} from '@activepieces/shared';
import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import {
  AlertCircle,
  ChevronDown,
  Clock,
  Download,
  Filter,
  LayoutGrid,
  Pencil,
  Plus,
  Search,
  Workflow,
  X,
} from 'lucide-react';
import { useMemo } from 'react';

import { ApAvatar } from '@/components/custom/ap-avatar';
import { DataTable, RowDataWithActions } from '@/components/custom/data-table';
import { DataTableColumnHeader } from '@/components/custom/data-table/data-table-column-header';
import { Toolbar, ToolbarSpacer } from '@/components/custom/page';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { userHooks } from '@/hooks/user-hooks';
import { formatUtils } from '@/lib/format-utils';
import { cn } from '@/lib/utils';

import { TimeSavedFilterContent } from '../components/time-saved-filter-content';
import { exportFlowDetailsCsv } from '../lib/impact-utils';
import { useDetailsFilters } from '../lib/use-details-filters';
import {
  FlowDetailRow,
  useFlowDetailsData,
} from '../lib/use-flow-details-data';

import { EditTimeSavedPopover } from './edit-time-saved-popover';

type FlowsDetailsProps = {
  report?: PlatformAnalyticsReport;
  isLoading: boolean;
  isError: boolean;
  projects?: ProjectWithLimits[];
};

export function FlowsDetails({
  report,
  isLoading,
  isError,
  projects,
}: FlowsDetailsProps) {
  const {
    flowDetails,
    uniqueOwners,
    flowsMissingTimeSaved,
    timeSavedPerRunOverrides,
  } = useFlowDetailsData(report);

  const filters = useDetailsFilters(flowDetails, uniqueOwners);

  const columns = useMemo(
    (): ColumnDef<RowDataWithActions<FlowDetailRow>>[] => [
      {
        accessorKey: 'flowName',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('Flow Name')} />
        ),
        cell: ({ row }) => (
          <div className="flex min-w-0 items-center gap-2">
            <Workflow className="size-4 shrink-0 text-accent-11" />
            <span className="truncate">{row.original.flowName}</span>
          </div>
        ),
        size: 300,
      },
      {
        accessorKey: 'ownerId',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('Owner')} />
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <ApAvatar
              id={row.original.ownerId ?? ''}
              size="small"
              includeAvatar={true}
              includeName={false}
            />
            <OwnerFullName id={row.original.ownerId ?? ''} />
          </div>
        ),
      },
      {
        accessorKey: 'timeSavedPerRun',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t('Time Saved Per Run')}
            sortable
          />
        ),
        cell: ({ row }) => {
          const override = timeSavedPerRunOverrides?.[row.original.flowId];
          const timeSavedPerRun =
            override?.value ?? row.original.timeSavedPerRun;
          const hasValue = timeSavedPerRun && timeSavedPerRun > 0;
          const displayValue = hasValue
            ? formatUtils.formatToHoursAndMinutes(timeSavedPerRun)
            : null;

          const userHasAccessToProject = projects?.some(
            (project) => project.id === row.original.projectId,
          );

          if (!userHasAccessToProject) {
            return (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex cursor-not-allowed items-center gap-1.5 text-gray-11">
                    <Plus className="size-3.5" />
                    <span>{t('Add Estimated Time')}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top">
                  {t("You don't have permission to add")}
                </TooltipContent>
              </Tooltip>
            );
          }

          if (hasValue) {
            return (
              <div className="group/cell flex items-center gap-1.5">
                <span>{displayValue}</span>
                <span className="inline-flex opacity-0 group-hover/cell:opacity-100 transition-opacity">
                  <EditTimeSavedPopover
                    flowId={row.original.flowId}
                    currentValue={timeSavedPerRun}
                  >
                    <Button variant="link" size="xs">
                      <Pencil />
                      <span>{t('Edit')}</span>
                    </Button>
                  </EditTimeSavedPopover>
                </span>
              </div>
            );
          }

          return (
            <EditTimeSavedPopover
              flowId={row.original.flowId}
              currentValue={timeSavedPerRun}
            >
              <div className="flex cursor-pointer items-center gap-1.5 text-accent-11 hover:underline">
                <Plus className="size-3.5" />
                <span>{t('Add Estimated Time')}</span>
              </div>
            </EditTimeSavedPopover>
          );
        },
      },
      {
        accessorKey: 'minutesSaved',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t('Total Time Saved')}
            sortable
          />
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5">
            <Clock className="size-3.5 text-gray-11" />
            <span className="tabular-nums">
              {formatUtils.formatToHoursAndMinutes(row.original.minutesSaved)}
            </span>
          </div>
        ),
      },
      {
        accessorKey: 'projectName',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('Project Name')} />
        ),
        cell: ({ row }) => {
          const project = projects?.find(
            (p) => p.id === row.original.projectId,
          );
          const userHasAccess = !!project;
          const projectName = project?.displayName ?? row.original.projectName;

          const projectAvatar =
            project?.type === ProjectType.TEAM ? (
              <Avatar
                className="flex size-5 shrink-0 items-center justify-center rounded-md text-xs font-semibold"
                style={{
                  backgroundColor:
                    PROJECT_COLOR_PALETTE[project.icon.color].color,
                  color: PROJECT_COLOR_PALETTE[project.icon.color].textColor,
                }}
              >
                <span className="scale-75">
                  {projectName.charAt(0).toUpperCase()}
                </span>
              </Avatar>
            ) : (
              <LayoutGrid className="size-4 shrink-0" />
            );

          if (userHasAccess) {
            return (
              <div className="flex items-center gap-1.5 text-gray-12">
                {projectAvatar}
                {projectName}
              </div>
            );
          }

          return (
            <div className="flex items-center gap-1.5 text-gray-11">
              {projectAvatar}
              {projectName}
            </div>
          );
        },
      },
    ],
    [projects, timeSavedPerRunOverrides],
  );

  if (!flowDetails && !isLoading) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4">
      <Toolbar>
        <div className="relative w-[200px]">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-gray-11" />
          <Input
            placeholder={t('Search flows')}
            value={filters.searchQuery}
            onChange={(e) => filters.setSearchQuery(e.target.value)}
            className="pl-9 pr-8"
          />
          {filters.searchQuery && (
            <button
              onClick={() => filters.setSearchQuery('')}
              className="absolute top-1/2 right-2.5 -translate-y-1/2 text-gray-11 hover:text-gray-12"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        <TimeSavedFilter filters={filters} />
        <OwnerFilter filters={filters} />

        <ToolbarSpacer />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              onClick={() => exportFlowDetailsCsv([...filters.filteredData])}
              disabled={filters.filteredData.length === 0}
            >
              <Download />
              {t('Download')}
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t('Download flows details')}</TooltipContent>
        </Tooltip>
      </Toolbar>

      {flowsMissingTimeSaved > 0 && (
        <Alert variant="warning">
          <AlertCircle />
          <AlertTitle>
            {t(
              'There are {count} flows missing their Estimated Time Per Run.',
              { count: flowsMissingTimeSaved },
            )}
          </AlertTitle>
          <AlertDescription>
            {t('This will cause inaccurate analytics and unreliable data.')}
          </AlertDescription>
        </Alert>
      )}

      <DataTable
        columns={columns}
        page={{
          data: filters.filteredData,
          next: null,
          previous: null,
        }}
        isLoading={isLoading}
        isError={isError}
        errorStateEntity={t('flows')}
        clientPagination={true}
        initialSorting={[{ id: 'minutesSaved', desc: true }]}
        emptyStateTextTitle={t('No Flows Found')}
        emptyStateTextDescription={
          filters.searchQuery
            ? t('Try adjusting your search')
            : t('Start running your flows to see time saved')
        }
        emptyStateIcon={<Workflow />}
      />
    </div>
  );
}

type FiltersReturn = ReturnType<typeof useDetailsFilters>;

function TimeSavedFilter({ filters }: { filters: FiltersReturn }) {
  return (
    <Popover
      open={filters.timeSavedPopoverOpen}
      onOpenChange={filters.handleTimeSavedPopoverOpen}
    >
      <PopoverTrigger asChild>
        <Button variant="outline" className="border-dashed font-normal">
          <Clock />
          <span>{t('Total Time Saved')}</span>
          {filters.timeSavedLabel && (
            <span className="rounded-md bg-gray-5 px-1.5 py-0.5 text-xs font-medium">
              {filters.timeSavedLabel}
            </span>
          )}
          <ChevronDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px]" align="start">
        <TimeSavedFilterContent
          draftMin={filters.draftTimeSaved.min}
          onMinChange={(v) => filters.updateDraftTimeSaved({ min: v })}
          unitMin={filters.draftTimeSaved.unitMin}
          onCycleUnitMin={filters.cycleDraftTimeUnitMin}
          draftMax={filters.draftTimeSaved.max}
          onMaxChange={(v) => filters.updateDraftTimeSaved({ max: v })}
          unitMax={filters.draftTimeSaved.unitMax}
          onCycleUnitMax={filters.cycleDraftTimeUnitMax}
          onApply={filters.applyTimeSavedFilter}
        />
      </PopoverContent>
    </Popover>
  );
}

function OwnerFilter({ filters }: { filters: FiltersReturn }) {
  return (
    <Popover
      open={filters.ownerFilter.popoverOpen}
      onOpenChange={(open) => filters.updateOwnerFilter({ popoverOpen: open })}
    >
      <PopoverTrigger asChild>
        <Button variant="outline" className="border-dashed font-normal">
          <Filter />
          <span>{t('Owner')}</span>
          {filters.selectedOwners.length > 0 && (
            <span className="flex items-center gap-1">
              {filters.selectedOwners.slice(0, 2).map((owner) => (
                <span
                  key={owner.id}
                  className="flex items-center gap-1 rounded-md bg-gray-5 px-1.5 py-0.5 text-xs font-medium"
                >
                  <ApAvatar id={owner.id} size="xsmall" hideHover={true} />
                  <OwnerFullName id={owner.id} maxWidth="max-w-[80px]" />
                </span>
              ))}
              {filters.selectedOwners.length > 2 && (
                <span className="rounded-md bg-gray-5 px-1.5 py-0.5 text-xs font-medium">
                  +{filters.selectedOwners.length - 2}
                </span>
              )}
            </span>
          )}
          <ChevronDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[240px] p-0" align="start">
        <div className="p-2 border-b">
          <div className="relative">
            <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-gray-11" />
            <Input
              placeholder={t('Search owners...')}
              value={filters.ownerFilter.searchQuery}
              onChange={(e) =>
                filters.updateOwnerFilter({ searchQuery: e.target.value })
              }
              className="pl-8"
            />
          </div>
        </div>
        <div className="max-h-[220px] overflow-auto">
          {filters.filteredOwners.map((owner) => (
            <div
              key={owner.id}
              onClick={() => filters.toggleOwner(owner.id)}
              className="flex items-center gap-2.5 px-3 py-2 text-sm cursor-pointer hover:bg-gray-4"
            >
              <Checkbox
                checked={filters.ownerFilter.selectedIds.includes(owner.id)}
                className="pointer-events-none"
              />
              <ApAvatar id={owner.id} size="small" hideHover={true} />
              <OwnerFullName id={owner.id} />
            </div>
          ))}
          {filters.filteredOwners.length === 0 && (
            <div className="py-6 text-center text-sm text-gray-11">
              {t('No owners found')}
            </div>
          )}
        </div>
        {filters.ownerFilter.selectedIds.length > 0 && (
          <div className="p-2 border-t">
            <button
              onClick={() => filters.updateOwnerFilter({ selectedIds: [] })}
              className="w-full text-center text-sm text-accent-11 hover:underline"
            >
              {t('Clear all')}
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

function OwnerFullName({
  id,
  maxWidth = 'max-w-[120px]',
}: {
  id: string;
  maxWidth?: string;
}) {
  const { data: user } = userHooks.useUserById(id);
  return (
    <span className={cn('truncate', maxWidth)}>
      {user ? `${user.firstName} ${user.lastName}`.trim() : id}
    </span>
  );
}
