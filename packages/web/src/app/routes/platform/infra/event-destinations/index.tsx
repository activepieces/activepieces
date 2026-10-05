import {
  isNil,
  tryCatch,
  tryCatchSync,
  unique,
} from '@activepieces/core-utils';
import { ApFlagId, EventDestination } from '@activepieces/shared';
import { useQueries } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import { Globe, ListChecks, Radio } from 'lucide-react';
import { useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { DashboardPageHeader } from '@/app/components/dashboard-page-header';
import { AnimatedIconButton } from '@/components/custom/animated-icon-button';
import { DataTable, RowDataWithActions } from '@/components/custom/data-table';
import { DataTableColumnHeader } from '@/components/custom/data-table/data-table-column-header';
import { TextWithTooltip } from '@/components/custom/text-with-tooltip';
import { PlusIcon } from '@/components/icons/plus';
import { Switch } from '@/components/ui/switch';
import { flowHooks, flowsApi } from '@/features/flows';
import { flagsHooks } from '@/hooks/flags-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { AdminControl, adminControl } from '@/lib/admin-control';
import { useNewWindow } from '@/lib/navigation-utils';

import { sampleData } from '../../sample-data';

import { DestinationStartCards } from './components/destination-start-cards';
import EventDestinationActions from './components/event-destination-actions';
import { destinationErrors } from './lib/destination-errors';
import { eventDestinationsCollectionUtils } from './lib/event-destinations-collection';
import { eventGroupUtils } from './lib/event-groups';
import { EVENT_STREAMING_PATH } from './lib/event-streaming-path';
import { parseFlowIdFromUrl } from './lib/parse-flow-id-from-url';

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
  const totalEventCount = eventGroupUtils.countEvents();

  const flowIds = useMemo(
    () =>
      unique(
        destinations.flatMap((destination) => {
          const parsed = parseFlowIdFromUrl({
            url: destination.url,
            webhookPrefixUrl: webhookPrefixUrl ?? null,
          });
          return parsed.kind === 'flow' ? [parsed.flowId] : [];
        }),
      ),
    [destinations, webhookPrefixUrl],
  );

  const flowQueries = useQueries({
    queries: flowIds.map((flowId) => ({
      queryKey: flowHooks.createFlowQueryKeys({ flowId, versionId: undefined }),
      queryFn: () => flowsApi.get(flowId).catch(() => null),
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
          <div className="flex min-w-0 flex-col gap-0.5">
            <TextWithTooltip tooltipMessage={destinationTitle(row.original)}>
              <span className="truncate text-sm font-medium">
                {destinationTitle(row.original)}
              </span>
            </TextWithTooltip>
            <TextWithTooltip tooltipMessage={row.original.url}>
              <span className="truncate font-mono text-xs text-gray-11">
                {row.original.url}
              </span>
            </TextWithTooltip>
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
          <span className="text-sm text-gray-11">
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
            aria-label={t('Enable {destination}', {
              destination: destinationTitle(row.original),
            })}
            onCheckedChange={(enabled) =>
              toggleDestination({ destinationId: row.original.id, enabled })
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
        <AnimatedIconButton
          {...adminControl(
            AdminControl.EVENT_DESTINATIONS_DESTINATION_NEW_OPEN,
          )}
          icon={PlusIcon}
          iconSize={16}
          size="sm"
          asChild
        >
          <Link to={`${EVENT_STREAMING_PATH}/new`}>{t('New Destination')}</Link>
        </AnimatedIconButton>
      </DashboardPageHeader>
      <div className="flex w-full flex-col px-4 pb-6">
        <DataTable
          bordered={true}
          columns={columns}
          page={{ data: destinations, next: null, previous: null }}
          isLoading={isLoading}
          isError={isError}
          errorStateEntity={t('destinations')}
          onRetry={eventDestinationsCollectionUtils.refetch}
          hidePagination={true}
          onRowClick={(row, newWindow) =>
            newWindow
              ? openNewWindow(`${EVENT_STREAMING_PATH}/${row.id}`)
              : navigate(`${EVENT_STREAMING_PATH}/${row.id}`)
          }
          toolbarButtons={[
            <span key="count" className="shrink-0 text-xs text-gray-11">
              {t('destinationsCount', { count: destinations.length })}
            </span>,
          ]}
          emptyStateTextTitle={t('No destinations yet')}
          emptyStateTextDescription={t(
            'Stream every audit event on your platform over OpenTelemetry (OTLP), or send it to a flow.',
          )}
          emptyStateIcon={
            <span className="mb-1 mt-10 flex size-11 items-center justify-center rounded-lg bg-gray-3">
              <Radio className="size-5" />
            </span>
          }
          emptyStateAction={<DestinationStartCards />}
        />
      </div>
    </>
  );
};

async function toggleDestination({
  destinationId,
  enabled,
}: {
  destinationId: string;
  enabled: boolean;
}): Promise<void> {
  const { error } = await tryCatch(
    () =>
      eventDestinationsCollectionUtils.update({
        destinationId,
        request: { enabled },
      }).isPersisted.promise,
  );
  if (!isNil(error)) {
    toast.error(destinationErrors.describe(error));
  }
}

export default EventDestinationsPage;
