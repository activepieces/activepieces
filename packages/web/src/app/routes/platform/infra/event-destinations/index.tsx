import {
  ApFlagId,
  DestinationType,
  EventDestination,
} from '@activepieces/shared';
import { useQueries } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import { Globe, ListChecks, Tag, Workflow } from 'lucide-react';
import { useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { DashboardPageHeader } from '@/app/components/dashboard-page-header';
import { LockedFeatureGuard } from '@/app/components/locked-feature-guard';
import { AnimatedIconButton } from '@/components/custom/animated-icon-button';
import { DataTable, RowDataWithActions } from '@/components/custom/data-table';
import { DataTableColumnHeader } from '@/components/custom/data-table/data-table-column-header';
import { TextWithTooltip } from '@/components/custom/text-with-tooltip';
import { PlusIcon } from '@/components/icons/plus';
import { Switch } from '@/components/ui/switch';
import { flowsApi } from '@/features/flows';
import { flagsHooks } from '@/hooks/flags-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { useNewWindow } from '@/lib/navigation-utils';

import { DestinationTypeTile } from './components/destination-type-tile';
import EventDestinationActions from './components/event-destination-actions';
import { eventDestinationsCollectionUtils } from './lib/event-destinations-collection';
import { buildEventGroups } from './lib/event-groups';
import { parseFlowIdFromUrl } from './lib/parse-flow-id-from-url';

const LISTING_PATH = '/platform/infrastructure/event-destinations';

const EventDestinationsPage = () => {
  const navigate = useNavigate();
  const openNewWindow = useNewWindow();
  const { platform } = platformHooks.useCurrentPlatform();
  const isEnabled = platform.plan.eventStreamingEnabled;
  const {
    data: destinations,
    isLoading,
    isError,
  } = eventDestinationsCollectionUtils.useAll(isEnabled);
  const { data: presets } = eventDestinationsCollectionUtils.usePresets();
  const { data: webhookPrefixUrl } = flagsHooks.useFlag<string>(
    ApFlagId.WEBHOOK_URL_PREFIX,
  );
  const eventGroups = buildEventGroups();
  const totalEventCount = eventGroups.reduce(
    (total, group) => total + group.events.length,
    0,
  );

  const flowIds = useMemo(
    () =>
      Array.from(
        new Set(
          destinations
            .map((destination) =>
              parseFlowIdFromUrl({
                url: destination.url,
                webhookPrefixUrl: webhookPrefixUrl ?? null,
              }),
            )
            .map((parsed) => (parsed.kind === 'flow' ? parsed.flowId : null))
            .filter((flowId): flowId is string => flowId !== null),
        ),
      ),
    [destinations, webhookPrefixUrl],
  );

  const flowQueries = useQueries({
    queries: flowIds.map((flowId) => ({
      queryKey: ['flow-display-name', flowId],
      queryFn: () => flowsApi.get(flowId),
    })),
  });

  const flowDisplayNameById = useMemo(() => {
    const entries = flowQueries
      .map((query, index): [string, string] | null =>
        query.data ? [flowIds[index], query.data.version.displayName] : null,
      )
      .filter((entry): entry is [string, string] => entry !== null);
    return new Map(entries);
  }, [flowQueries, flowIds]);

  const typeLabelByType = useMemo(
    () => new Map((presets ?? []).map((preset) => [preset.type, preset.label])),
    [presets],
  );

  const destinationTitle = useCallback(
    (destination: EventDestination) => {
      if (destination.name) {
        return destination.name;
      }
      const parsed = parseFlowIdFromUrl({
        url: destination.url,
        webhookPrefixUrl: webhookPrefixUrl ?? null,
      });
      if (parsed.kind === 'flow') {
        return (
          flowDisplayNameById.get(parsed.flowId) ??
          t('Destination (flow {flowId})', { flowId: parsed.flowId })
        );
      }
      return destination.url;
    },
    [flowDisplayNameById, webhookPrefixUrl],
  );

  const columns: ColumnDef<RowDataWithActions<EventDestination>>[] = useMemo(
    () => [
      {
        accessorKey: 'name',
        filterFn: (row, _columnId, filterValue: string) => {
          const needle = String(filterValue).toLowerCase();
          return (
            (row.original.name ?? '').toLowerCase().includes(needle) ||
            row.original.url.toLowerCase().includes(needle)
          );
        },
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t('Destination')}
            icon={Globe}
          />
        ),
        cell: ({ row }) => (
          <div className="flex min-w-0 items-center gap-3">
            <DestinationTypeTile type={row.original.type} />
            <div className="flex min-w-0 flex-col gap-0.5">
              <TextWithTooltip tooltipMessage={destinationTitle(row.original)}>
                <span className="truncate text-sm font-medium">
                  {destinationTitle(row.original)}
                </span>
              </TextWithTooltip>
              <TextWithTooltip tooltipMessage={row.original.url}>
                <span className="truncate font-mono text-xs text-muted-foreground">
                  {row.original.url}
                </span>
              </TextWithTooltip>
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'type',
        size: 160,
        filterFn: (row, _columnId, filterValue: string[]) =>
          filterValue.includes(row.original.type),
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('Type')} icon={Tag} />
        ),
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {typeLabelByType.get(row.original.type) ?? row.original.type}
          </span>
        ),
      },
      {
        id: 'events',
        size: 120,
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t('Events')}
            icon={ListChecks}
          />
        ),
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.events.length === totalEventCount
              ? t('All {total}', { total: totalEventCount })
              : t('{count} of {total}', {
                  count: row.original.events.length,
                  total: totalEventCount,
                })}
          </span>
        ),
      },
      {
        id: 'enabled',
        size: 100,
        notClickable: true,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('Enabled')} />
        ),
        cell: ({ row }) => (
          <Switch
            checked={row.original.enabled}
            onCheckedChange={(enabled) =>
              eventDestinationsCollectionUtils.update(row.original.id, {
                enabled,
              })
            }
          />
        ),
      },
      {
        id: 'actions',
        size: 60,
        notClickable: true,
        header: () => null,
        cell: ({ row }) => (
          <EventDestinationActions destination={row.original} />
        ),
      },
    ],
    [destinationTitle, totalEventCount, typeLabelByType],
  );

  return (
    <LockedFeatureGuard
      featureKey="EVENT_DESTINATIONS"
      locked={!isEnabled}
      lockTitle={t('Unlock Event Streaming')}
      lockDescription={t(
        'Forward every audit event we emit to a webhook, then handle it in a flow — wire it to Slack, Gmail, PagerDuty, or anywhere else.',
      )}
    >
      <>
        <DashboardPageHeader
          title={t('Event Streaming')}
          description={t(
            'Send a webhook for every audit event and build fully customizable alerts on top.',
          )}
        >
          <Link to={`${LISTING_PATH}/new`}>
            <AnimatedIconButton icon={PlusIcon} iconSize={16} size="sm">
              {t('New Destination')}
            </AnimatedIconButton>
          </Link>
        </DashboardPageHeader>
        <div className="flex w-full flex-col px-4 pb-6">
          <DataTable
            bordered={true}
            columns={columns}
            page={{ data: destinations, next: null, previous: null }}
            isLoading={isLoading}
            isError={isError}
            errorStateEntity={t('destinations')}
            clientFiltering={true}
            hidePagination={true}
            onRowClick={(row, newWindow) =>
              newWindow
                ? openNewWindow(`${LISTING_PATH}/${row.id}`)
                : navigate(`${LISTING_PATH}/${row.id}`)
            }
            filters={[
              {
                type: 'input',
                title: t('Search destinations'),
                accessorKey: 'name',
              },
              {
                type: 'select',
                title: t('Type'),
                accessorKey: 'type',
                options: Object.values(DestinationType).map((type) => ({
                  label: typeLabelByType.get(type) ?? type,
                  value: type,
                })),
              },
            ]}
            toolbarButtons={[
              <span
                key="count"
                className="shrink-0 text-xs text-muted-foreground"
              >
                {t('destinationsCount', { count: destinations.length })}
              </span>,
            ]}
            emptyStateTextTitle={t('No destinations yet')}
            emptyStateTextDescription={t(
              'Create one to start forwarding audit events.',
            )}
            emptyStateIcon={<Workflow className="size-14" />}
          />
        </div>
      </>
    </LockedFeatureGuard>
  );
};

export default EventDestinationsPage;
