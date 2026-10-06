import { isNil, tryCatch, unique } from '@activepieces/core-utils';
import {
  ApFlagId,
  EventDestination,
  EventDestinationFormat,
} from '@activepieces/shared';
import {
  Add01Icon,
  Delete02Icon,
  Globe02Icon,
  LinkSquare02Icon,
  PencilEdit01Icon,
  Pulse01Icon,
  RssIcon,
  WorkflowSquare02Icon,
} from '@hugeicons/core-free-icons';
import { useQueries } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { AdminPageHeader } from '@/app/routes/platform/admin-page-header';
import { DataTable, RowDataWithActions } from '@/components/custom/data-table';
import { DataTableColumnHeader } from '@/components/custom/data-table/data-table-column-header';
import { HugeiconsIcon } from '@/components/custom/hugeicons-icon';
import {
  DateCell,
  MutedCell,
  NameCell,
} from '@/components/custom/list/list-cells';
import { RowMenu, RowMenuItem } from '@/components/custom/list/row-menu';
import { Page } from '@/components/custom/page';
import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Switch } from '@/components/ui/switch';
import { flowHooks, flowsApi } from '@/features/flows';
import { flagsHooks } from '@/hooks/flags-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { useStableCallback } from '@/hooks/use-stable-callback';
import { AdminControl, adminControl } from '@/lib/admin-control';
import { mutationFeedback } from '@/lib/mutation-feedback';

import { sampleData } from '../../sample-data';

import { DeleteDestinationDialog } from './components/delete-destination-dialog';
import { DestinationStartCards } from './components/destination-start-cards';
import { destinationSummary } from './lib/destination-summary';
import { eventDestinationsCollectionUtils } from './lib/event-destinations-collection';
import { eventGroupUtils } from './lib/event-groups';
import { EVENT_STREAMING_PATH } from './lib/event-streaming-path';
import {
  parseFlowIdFromUrl,
  ParsedDestination,
} from './lib/parse-flow-id-from-url';

const EventDestinationsPage = () => {
  const navigate = useNavigate();
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
  const [deleting, setDeleting] = useState<DestinationRow | null>(null);
  const totalEventCount = eventGroupUtils.countEvents();

  const parsedDestinations = useMemo(
    () =>
      destinations.map((destination) => ({
        destination,
        parsed: parseFlowIdFromUrl({
          url: destination.url,
          webhookPrefixUrl: webhookPrefixUrl ?? null,
        }),
      })),
    [destinations, webhookPrefixUrl],
  );

  const flowIds = useMemo(
    () =>
      unique(
        parsedDestinations.flatMap(({ parsed }) =>
          parsed.kind === 'flow' ? [parsed.flowId] : [],
        ),
      ),
    [parsedDestinations],
  );

  const flowQueries = useQueries({
    queries: flowIds.map((flowId) => ({
      queryKey: flowHooks.createFlowQueryKeys({ flowId, versionId: undefined }),
      queryFn: () => flowsApi.get(flowId).catch(() => null),
      enabled: !isSample,
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

  const rows: DestinationRow[] = parsedDestinations.map(
    ({ destination, parsed }) => ({
      id: destination.id,
      destination,
      parsed,
      title: destinationSummary.title({
        destination,
        parsed,
        flowDisplayName:
          parsed.kind === 'flow'
            ? flowDisplayNameById.get(parsed.flowId)
            : undefined,
      }),
    }),
  );

  const isEmpty = !isSample && !isLoading && !isError && rows.length === 0;

  const openDestination = (row: DestinationRow) =>
    navigate(`${EVENT_STREAMING_PATH}/${row.id}`);

  const menuItems = useStableCallback((row: DestinationRow): RowMenuItem[] => [
    {
      label: t('Edit'),
      icon: PencilEdit01Icon,
      control: AdminControl.EVENT_DESTINATIONS_DESTINATION_EDIT_OPEN,
      onSelect: () => openDestination(row),
    },
    {
      label: t('Open flow'),
      icon: LinkSquare02Icon,
      hidden: row.parsed.kind !== 'flow',
      control: AdminControl.EVENT_DESTINATIONS_HANDLER_FLOW_LINK,
      onSelect: () => {
        if (row.parsed.kind === 'flow') {
          window.open(
            `/flows/${row.parsed.flowId}`,
            '_blank',
            'noopener,noreferrer',
          );
        }
      },
    },
    {
      label: t('Delete'),
      icon: Delete02Icon,
      destructive: true,
      control: AdminControl.EVENT_DESTINATIONS_DESTINATION_DELETE_OPEN,
      onSelect: () => setDeleting(row),
    },
  ]);

  const columns = useMemo(
    (): ColumnDef<RowDataWithActions<DestinationRow>>[] => [
      {
        accessorKey: 'destination',
        size: 420,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('Destination')} />
        ),
        cell: ({ row }) => (
          <NameCell
            stacked
            media={<DestinationIcon row={row.original} />}
            title={row.original.title}
            sub={destinationSummary.formatLabel({
              format: row.original.destination.format,
              parsed: row.original.parsed,
            })}
          />
        ),
      },
      {
        accessorKey: 'events',
        size: 140,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('Events')} />
        ),
        cell: ({ row }) => (
          <MutedCell>
            {row.original.destination.events.length === totalEventCount
              ? t('All {total}', { total: totalEventCount })
              : t('{count} of {total}', {
                  count: row.original.destination.events.length,
                  total: totalEventCount,
                })}
          </MutedCell>
        ),
      },
      {
        accessorKey: 'created',
        size: 112,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('Created')} />
        ),
        cell: ({ row }) => (
          <DateCell value={row.original.destination.created} mode="short" />
        ),
      },
      {
        accessorKey: 'enabled',
        size: 96,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('Enabled')} />
        ),
        cell: ({ row }) => (
          <span className="flex" onClick={(event) => event.stopPropagation()}>
            <Switch
              checked={row.original.destination.enabled}
              disabled={isSample}
              aria-label={t('Enable {destination}', {
                destination: row.original.title,
              })}
              onCheckedChange={(enabled) =>
                toggleDestination({
                  destinationId: row.original.id,
                  enabled,
                }).catch(() => undefined)
              }
            />
          </span>
        ),
      },
      {
        id: 'actions',
        size: 56,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <RowMenu items={menuItems(row.original)} />
          </div>
        ),
      },
    ],
    [isSample, menuItems, totalEventCount],
  );

  const newButton = (
    <Button
      asChild
      {...adminControl(AdminControl.EVENT_DESTINATIONS_DESTINATION_NEW_OPEN)}
    >
      <Link to={`${EVENT_STREAMING_PATH}/new`}>
        <HugeiconsIcon icon={Add01Icon} />
        {t('New destination')}
      </Link>
    </Button>
  );

  return (
    <Page>
      <AdminPageHeader page="eventStreaming">{newButton}</AdminPageHeader>
      {isEmpty ? (
        <Empty className="rounded-2xl bg-panel shadow-edge">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <HugeiconsIcon icon={RssIcon} />
            </EmptyMedia>
            <EmptyTitle>{t('No destinations yet')}</EmptyTitle>
            <EmptyDescription>
              {t(
                'Stream every audit event on your platform over OpenTelemetry (OTLP), or send it to a flow.',
              )}
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent className="max-w-2xl">
            <DestinationStartCards />
          </EmptyContent>
        </Empty>
      ) : (
        <DataTable
          emptyStateTextTitle={t('No destinations yet')}
          emptyStateTextDescription={t(
            'Stream every audit event on your platform over OpenTelemetry (OTLP), or send it to a flow.',
          )}
          emptyStateIcon={<HugeiconsIcon icon={RssIcon} />}
          columns={columns}
          page={{ data: rows, next: null, previous: null }}
          hidePagination={true}
          onRowClick={(row) => openDestination(row)}
          isLoading={!isSample && isLoading}
          isError={!isSample && isError}
          errorStateEntity={t('destinations')}
          onRetry={() =>
            eventDestinationsCollectionUtils.refetch().catch(() => undefined)
          }
        />
      )}
      {deleting && (
        <DeleteDestinationDialog
          destination={deleting.destination}
          title={deleting.title}
          open={true}
          onOpenChange={(open) => {
            if (!open) {
              setDeleting(null);
            }
          }}
        />
      )}
    </Page>
  );
};

const DestinationIcon = ({ row }: { row: DestinationRow }) => {
  const Icon =
    row.parsed.kind === 'flow'
      ? WorkflowSquare02Icon
      : row.destination.format === EventDestinationFormat.RAW
      ? Globe02Icon
      : Pulse01Icon;
  return (
    <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-gray-3 text-gray-11 [&_svg]:size-3.5">
      <HugeiconsIcon icon={Icon} />
    </span>
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
    mutationFeedback.error({
      error,
      title: t("Couldn't update the destination"),
    });
    return;
  }
  mutationFeedback.undo({
    message: enabled ? t('Destination turned on') : t('Destination paused'),
    onUndo: () =>
      eventDestinationsCollectionUtils.update({
        destinationId,
        request: { enabled: !enabled },
      }).isPersisted.promise,
  });
}

type DestinationRow = {
  id: string;
  destination: EventDestination;
  parsed: ParsedDestination;
  title: string;
};

export default EventDestinationsPage;
