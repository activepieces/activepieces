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
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { DataTable, RowDataWithActions } from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table/data-table-column-header';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { userHooks } from '@/hooks/user-hooks';
import { formatUtils } from '@/lib/utils';

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
  projects?: ProjectWithLimits[];
};

export function FlowsDetails({
  report,
  isLoading,
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
          <div
            className="flex items-center gap-1 text-foreground hover:underline cursor-pointer max-w-[300px]"
            onClick={() =>
              window.open(
                `/projects/${row.original.projectId}/flows/${row.original.flowId}`,
                '_blank',
              )
            }
          >
            <Workflow className="size-4 mr-2 text-primary shrink-0" />
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
                  <div className="flex items-center gap-1.5 text-muted-foreground cursor-not-allowed">
                    <span>{displayValue ?? t('Not set')}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top">
                  {t("You don't have permission to edit this flow")}
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
                    <button className="flex items-center gap-1 px-1.5 py-0.5 rounded text-xs text-primary hover:bg-primary/10">
                      <Pencil className="h-3 w-3" />
                      <span>{t('Edit')}</span>
                    </button>
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
              <div className="flex items-center gap-1.5 cursor-pointer text-primary hover:underline">
                <Plus className="h-3.5 w-3.5" />
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
            <Clock className="h-3.5 w-3.5" />
            <span>
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
                className="size-5 shrink-0 flex items-center justify-center rounded-[4px] text-xs font-bold"
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
              <LayoutGrid className="h-4 w-4 shrink-0" />
            );

          if (userHasAccess) {
            return (
              <div
                className="flex items-center gap-1.5 text-foreground hover:underline cursor-pointer"
                onClick={() =>
                  window.open(`/projects/${row.original.projectId}`, '_blank')
                }
              >
                {projectAvatar}
                {projectName}
              </div>
            );
          }

          return (
            <div className="flex items-center gap-1.5 text-muted-foreground">
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
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t('Search flows')}
            value={filters.searchQuery}
            onChange={(e) => filters.setSearchQuery(e.target.value)}
            className="pl-9 pr-8"
          />
          {filters.searchQuery && (
            <button
              onClick={() => filters.setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <TimeSavedFilter filters={filters} />
        <OwnerFilter filters={filters} />

        {filters.hasActiveFilters && (
          <button
            onClick={filters.clearAllFilters}
            className="flex items-center gap-1 text-sm text-primary hover:underline"
          >
            <X className="h-3.5 w-3.5" />
            {t('Clear')}
          </button>
        )}

        <div className="flex-1" />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportFlowDetailsCsv([...filters.filteredData])}
              disabled={filters.filteredData.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              {t('Download')}
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t('Download flows details')}</TooltipContent>
        </Tooltip>
      </div>

      {flowsMissingTimeSaved > 0 && (
        <div className="flex items-start justify-between gap-3 p-4 rounded-lg border border-warning/50 bg-warning/10">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium">
                {t(
                  'There are {count} flows missing their Estimated Time Per Run.',
                  { count: flowsMissingTimeSaved },
                )}
              </p>
              <p className="text-sm text-muted-foreground">
                {t('This will cause inaccurate analytics and unreliable data.')}
              </p>
            </div>
          </div>
        </div>
      )}

      <DataTable
        columns={columns}
        page={{
          data: filters.filteredData,
          next: null,
          previous: null,
        }}
        isLoading={isLoading}
        clientPagination={true}
        initialSorting={[{ id: 'minutesSaved', desc: true }]}
        emptyStateTextTitle={t('No Flows Found')}
        emptyStateTextDescription={
          filters.searchQuery
            ? t('Try adjusting your search')
            : t('Start running your flows to see time saved')
        }
        emptyStateIcon={
          <Workflow className="h-10 w-10 text-muted-foreground" />
        }
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
        <Button variant="outline" className="gap-2 font-normal border-dashed">
          <Clock className="h-4 w-4" />
          <span>{t('Total Time Saved')}</span>
          {filters.timeSavedLabel && (
            <span className="rounded bg-accent px-1.5 py-0.5 text-xs font-medium">
              {filters.timeSavedLabel}
            </span>
          )}
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-4" align="start">
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
          onClear={filters.clearTimeSavedFilter}
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
        <Button variant="outline" className="gap-2 font-normal border-dashed">
          <Filter className="h-4 w-4" />
          <span>{t('Owner')}</span>
          {filters.selectedOwners.length > 0 && (
            <span className="flex items-center gap-1">
              {filters.selectedOwners.slice(0, 2).map((owner) => (
                <span
                  key={owner.id}
                  className="flex items-center gap-1 rounded bg-accent px-1.5 py-0.5 text-xs font-medium"
                >
                  <ApAvatar id={owner.id} size="xsmall" hideHover={true} />
                  <OwnerFullName id={owner.id} maxWidth="max-w-[80px]" />
                </span>
              ))}
              {filters.selectedOwners.length > 2 && (
                <span className="rounded bg-accent px-1.5 py-0.5 text-xs font-medium">
                  +{filters.selectedOwners.length - 2}
                </span>
              )}
            </span>
          )}
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[240px] p-0" align="start">
        <div className="p-2 border-b">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t('Search owners...')}
            value={filters.ownerFilter.searchQuery}
            onChange={(e) =>
              filters.updateOwnerFilter({ searchQuery: e.target.value })
            }
              className="pl-8 h-8"
            />
          </div>
        </div>
        <div className="max-h-[220px] overflow-auto">
          {filters.filteredOwners.map((owner) => (
            <div
              key={owner.id}
              onClick={() => filters.toggleOwner(owner.id)}
              className="flex items-center gap-2.5 px-3 py-2 text-sm cursor-pointer hover:bg-accent"
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
            <div className="py-6 text-center text-sm text-muted-foreground">
              {t('No owners found')}
            </div>
          )}
        </div>
        {filters.ownerFilter.selectedIds.length > 0 && (
          <div className="p-2 border-t">
            <button
              onClick={() => filters.updateOwnerFilter({ selectedIds: [] })}
              className="w-full text-center text-sm text-primary hover:underline"
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
    <span className={`truncate ${maxWidth}`}>
      {user ? `${user.firstName} ${user.lastName}`.trim() : id}
    </span>
  );
}
