import { ApFlagId, EventDestination } from '@activepieces/shared';
import { useQueries } from '@tanstack/react-query';
import { t } from 'i18next';
import { ExternalLink, Pencil, Plus, Trash2, Webhook } from 'lucide-react';
import { useMemo, useState } from 'react';

import {
  AdminTabs,
  adminSectionHeader,
} from '@/app/routes/platform/admin-tabs';
import { ConfirmDialog } from '@/components/custom/confirm-dialog';
import { DataTable } from '@/components/custom/data-table';
import { RowMenuItem } from '@/components/custom/list/row-menu';
import { Page, PageHeader } from '@/components/custom/page';
import { Button } from '@/components/ui/button';
import { flowsApi } from '@/features/flows';
import { flagsHooks } from '@/hooks/flags-hooks';
import { platformHooks } from '@/hooks/platform-hooks';

import { sampleData } from '../../sample-data';

import { EventDestinationDialog } from './components/event-destination-dialog';
import {
  DestinationRow,
  eventDestinationColumns,
} from './components/event-destination-row';
import { eventDestinationsCollectionUtils } from './lib/event-destinations-collection';
import { parseFlowIdFromUrl } from './lib/parse-flow-id-from-url';
import { useEventLabels } from './lib/use-event-labels';

const EventDestinationsPage = () => {
  const { platform } = platformHooks.useCurrentPlatform();
  const isEnabled = platform.plan.eventStreamingEnabled;
  const {
    data: liveDestinations,
    isLoading,
    isError,
  } = eventDestinationsCollectionUtils.useAll(isEnabled);
  const [editing, setEditing] = useState<EventDestination | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<EventDestination | null>(null);
  const isSample = !isEnabled;
  const destinations = isSample
    ? sampleData.eventDestinations()
    : liveDestinations;
  const { data: webhookPrefixUrl } = flagsHooks.useFlag<string>(
    ApFlagId.WEBHOOK_URL_PREFIX,
  );
  const eventLabels = useEventLabels();

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
      Array.from(
        new Set(
          parsedDestinations
            .map(({ parsed }) =>
              parsed.kind === 'flow' ? parsed.flowId : null,
            )
            .filter((id): id is string => id !== null),
        ),
      ),
    [parsedDestinations],
  );

  const flowQueries = useQueries({
    queries: flowIds.map((flowId) => ({
      queryKey: ['flow-display-name', flowId],
      queryFn: () => flowsApi.get(flowId),
    })),
  });

  const flowDisplayNameById = useMemo(() => {
    const map = new Map<string, string>();
    flowQueries.forEach((query, index) => {
      const flow = query.data;
      if (flow) {
        map.set(flowIds[index], flow.version.displayName);
      }
    });
    return map;
  }, [flowQueries, flowIds]);

  const rows: DestinationRow[] = parsedDestinations.map(
    ({ destination, parsed }) => ({
      id: destination.id,
      destination,
      parsed,
      flowDisplayName:
        parsed.kind === 'flow'
          ? flowDisplayNameById.get(parsed.flowId)
          : undefined,
    }),
  );

  const menuItems = (row: DestinationRow): RowMenuItem[] => [
    {
      label: t('Edit'),
      icon: Pencil,
      onSelect: () => setEditing(row.destination),
    },
    {
      label: t('Open flow'),
      icon: ExternalLink,
      hidden: row.parsed.kind !== 'flow',
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
      icon: Trash2,
      destructive: true,
      onSelect: () => setDeleting(row.destination),
    },
  ];

  const newButton = (
    <Button onClick={() => setCreating(true)}>
      <Plus />
      {t('New destination')}
    </Button>
  );

  return (
    <Page>
      <PageHeader
        title={adminSectionHeader('auditLog').title}
        description={adminSectionHeader('auditLog').description}
      >
        {newButton}
      </PageHeader>
      <AdminTabs section="auditLog" />
      <DataTable
        emptyStateTextTitle={t('Nothing is listening yet')}
        emptyStateTextDescription={t(
          'Send events to a URL you own, or to a flow that routes them on to Slack, email or a ticket.',
        )}
        emptyStateIcon={<Webhook />}
        emptyStateAction={newButton}
        columns={eventDestinationColumns({ eventLabels, menuItems })}
        page={{ data: rows, next: null, previous: null }}
        hidePagination={true}
        onRowClick={(row) => setEditing(row.destination)}
        isLoading={!isSample && isLoading}
        isError={!isSample && isError}
        errorStateEntity={t('destinations')}
      />
      <EventDestinationDialog
        destination={null}
        open={creating}
        onOpenChange={setCreating}
      />
      <EventDestinationDialog
        destination={editing}
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
      />
      {deleting && (
        <ConfirmDialog
          open
          onOpenChange={(open) => !open && setDeleting(null)}
          title={t('Delete destination?')}
          description={t('Events stop being sent here immediately.')}
          confirmLabel={t('Delete')}
          onConfirm={async () => {
            eventDestinationsCollectionUtils.delete([deleting.id]);
          }}
        />
      )}
    </Page>
  );
};

export default EventDestinationsPage;
