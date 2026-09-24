import { tryCatchSync } from '@activepieces/core-utils';
import { ApFlagId, EventDestination } from '@activepieces/shared';
import { useQueries } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import { Globe, ListChecks, Radio } from 'lucide-react';
import { useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { DashboardPageHeader } from '@/app/components/dashboard-page-header';
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

import { sampleData } from '../../sample-data';

import { DestinationStartCards } from './components/destination-start-cards';
import EventDestinationActions from './components/event-destination-actions';
import { eventDestinationsCollectionUtils } from './lib/event-destinations-collection';
import { buildEventGroups } from './lib/event-groups';
import { parseFlowIdFromUrl } from './lib/parse-flow-id-from-url';

const FORM_PATH = '/platform/security/event-destinations';

const EventDestinationsPage = () => {
  const navigate = useNavigate();
  const openNewWindow = useNewWindow();
  const { platform } = platformHooks.useCurrentPlatform();
  const isEnabled = platform.plan.eventStreamingEnabled;
  const {
    data: liveDestinations,
    isLoading,
    isError,
  } = eventDestinationsCollectionUtils.useAll(isEnabled);
  const isSample = !isEnabled;
  const destinations = isSample
    ? sampleData.eventDestinations()
    : liveDestinations;
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

  const destinationTitle = useCallback(
    (destination: EventDestination) => {
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
      const { data: url } = tryCatchSync(() => new URL(destination.url));
      return url?.host ?? destination.url;
    },
    [flowDisplayNameById, webhookPrefixUrl],
  );

  const columns: ColumnDef<RowDataWithActions<EventDestination>>[] = useMemo(
    () => [
      {
        id: 'destination',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t('Destination')}
            icon={Globe}
          />
        ),
        cell: ({ row }) => (
          <div className="flex min-w-0 items-center gap-3">
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
    [destinationTitle, totalEventCount],
  );

  return (
    <>
      <DashboardPageHeader
        title={t('Event Streaming')}
        description={t(
          'Stream every audit event in OpenTelemetry (OTLP) format to Datadog, PostHog, Grafana Loki, or any OTLP backend. Or send it as raw JSON to a webhook or a handler flow.',
        )}
      >
        <Link to={`${FORM_PATH}/new`}>
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
          hidePagination={true}
          onRowClick={(row, newWindow) =>
            newWindow
              ? openNewWindow(`${FORM_PATH}/${row.id}`)
              : navigate(`${FORM_PATH}/${row.id}`)
          }
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
            'Stream every audit event on your platform over OpenTelemetry (OTLP), or send it to a flow.',
          )}
          emptyStateIcon={
            <span className="mb-1 mt-10 flex size-11 items-center justify-center rounded-lg bg-muted">
              <Radio className="size-5" />
            </span>
          }
          emptyStateAction={<DestinationStartCards formPath={FORM_PATH} />}
        />
      </div>
    </>
  );
};

export default EventDestinationsPage;
