import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import {
  AlertCircle,
  ChevronDown,
  Clock,
  Download,
  Filter,
  LayoutGrid,
  Plus,
  Search,
  Workflow,
} from 'lucide-react';
import { useMemo } from 'react';

import { ApAvatar } from '@/components/custom/ap-avatar';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { DataTable, RowDataWithActions } from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table/data-table-column-header';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { formatUtils } from '@/lib/utils';
import {
  PlatformAnalyticsReport,
  ProjectWithLimits,
} from '@activepieces/shared';

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
          <ApAvatar
            id={row.original.ownerId ?? ''}
            size="small"
            includeAvatar={true}
            includeName={true}
          />
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

          return (
            <EditTimeSavedPopover
              flowId={row.original.flowId}
              currentValue={timeSavedPerRun}
            >
              {hasValue ? (
                <div className="flex items-center gap-1.5 cursor-pointer hover:text-primary">
                  <span>{displayValue}</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 cursor-pointer text-primary hover:underline">
                  <Plus className="h-3.5 w-3.5" />
                  <span>{t('Add Estimated Time')}</span>
                </div>
              )}
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
            <span>{formatUtils.formatToHoursAndMinutes(row.original.minutesSaved)}</span>
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

          if (userHasAccess) {
            return (
              <div
                className="flex items-center gap-1 text-foreground hover:underline cursor-pointer"
                onClick={() =>
                  window.open(`/projects/${row.original.projectId}`, '_blank')
                }
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                {projectName}
              </div>
            );
          }

          return (
            <div className="flex items-center gap-1 text-muted-foreground">
              <LayoutGrid className="h-3.5 w-3.5" />
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
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t('Search flows')}
            value={filters.searchQuery}
            onChange={(e) => filters.setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <TimeSavedFilter filters={filters} />
        <OwnerFilter filters={filters} />

        {filters.hasActiveFilters && (
          <button
            onClick={filters.clearAllFilters}
            className="text-sm text-primary hover:underline"
          >
            {t('Clear all')}
          </button>
        )}

        <div className="flex-1" />

        <Button
          variant="outline"
          size="sm"
          onClick={() => exportFlowDetailsCsv([...filters.filteredData])}
          disabled={filters.filteredData.length === 0}
        >
          <Download className="h-4 w-4 mr-2" />
          {t('Download')}
        </Button>
      </div>

      {flowsMissingTimeSaved > 0 ? (
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
              <MyFlowsToggle
                checked={filters.showMyFlowsOnly}
                onCheckedChange={filters.setShowMyFlowsOnly}
                className="mt-2"
              />
            </div>
          </div>
        </div>
      ) : (
        <MyFlowsToggle
          checked={filters.showMyFlowsOnly}
          onCheckedChange={filters.setShowMyFlowsOnly}
        />
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
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label className="text-sm text-muted-foreground">
              {t('Minimum')}
            </Label>
            <div className="relative">
              <Input
                type="number"
                min={0}
                placeholder="0"
                value={filters.draftTimeSavedMin}
                onChange={(e) => filters.setDraftTimeSavedMin(e.target.value)}
                className="pr-12"
              />
              <button
                type="button"
                onClick={filters.cycleDraftTimeUnit}
                className="absolute bg-accent px-1.5 py-0.5 rounded-sm right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground cursor-pointer select-none"
              >
                {filters.draftTimeUnit}
              </button>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-sm text-muted-foreground">
              {t('Maximum')}
            </Label>
            <div className="relative">
              <Input
                type="number"
                min={0}
                placeholder="∞"
                value={filters.draftTimeSavedMax}
                onChange={(e) => filters.setDraftTimeSavedMax(e.target.value)}
                className="pr-12"
              />
              <button
                type="button"
                onClick={filters.cycleDraftTimeUnit}
                className="absolute bg-accent px-1.5 py-0.5 rounded-sm right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground cursor-pointer select-none"
              >
                {filters.draftTimeUnit}
              </button>
            </div>
          </div>
          <Button
            onClick={filters.applyTimeSavedFilter}
            className="w-full mt-1"
          >
            {t('Apply')}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function OwnerFilter({ filters }: { filters: FiltersReturn }) {
  return (
    <Popover
      open={filters.ownerPopoverOpen}
      onOpenChange={filters.setOwnerPopoverOpen}
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
                  <ApAvatar id={owner.id} size="small" />
                  <span className="max-w-[60px] truncate">
                    {owner.name.split('@')[0]}
                  </span>
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
              value={filters.ownerSearchQuery}
              onChange={(e) => filters.setOwnerSearchQuery(e.target.value)}
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
                checked={filters.selectedOwnerIds.includes(owner.id)}
                className="pointer-events-none"
              />
              <ApAvatar id={owner.id} size="small" />
              <span className="truncate">{owner.name}</span>
            </div>
          ))}
          {filters.filteredOwners.length === 0 && (
            <div className="py-6 text-center text-sm text-muted-foreground">
              {t('No owners found')}
            </div>
          )}
        </div>
        {filters.selectedOwnerIds.length > 0 && (
          <div className="p-2 border-t">
            <button
              onClick={() => filters.setSelectedOwnerIds([])}
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

function MyFlowsToggle({
  checked,
  onCheckedChange,
  className,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-2 shrink-0 ${className ?? ''}`}>
      <Switch
        id="my-flows-only"
        checked={checked}
        onCheckedChange={onCheckedChange}
      />
      <Label htmlFor="my-flows-only" className="text-sm cursor-pointer">
        {t('Display my flows only')}
      </Label>
    </div>
  );
}
