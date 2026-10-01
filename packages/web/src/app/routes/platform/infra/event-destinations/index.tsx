import { ApFlagId } from '@activepieces/shared';
import { useQueries } from '@tanstack/react-query';
import { t } from 'i18next';
import { Webhook } from 'lucide-react';
import { useMemo } from 'react';

import { AnimatedIconButton } from '@/components/custom/animated-icon-button';
import { DataTable } from '@/components/custom/data-table';
import { Page, PageHeader } from '@/components/custom/page';
import { PlusIcon } from '@/components/icons/plus';
import { EmptyMedia } from '@/components/ui/empty';
import { flowsApi } from '@/features/flows';
import { flagsHooks } from '@/hooks/flags-hooks';
import { platformHooks } from '@/hooks/platform-hooks';

import { sampleData } from '../../sample-data';

import { EventDestinationDialog } from './components/event-destination-dialog';
import EventDestinationActions from './components/event-destination-actions';
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
  const { data: liveDestinations, isLoading } =
    eventDestinationsCollectionUtils.useAll(isEnabled);
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

  return (
    <Page>
      <PageHeader
        title={t('Event streaming')}
        description={t(
          'Each chosen audit event is posted to a URL you own, or handed to a flow on this platform.',
        )}
      >
        <EventDestinationDialog destination={null}>
          <AnimatedIconButton icon={PlusIcon} iconSize={20}>
            {t('New destination')}
          </AnimatedIconButton>
        </EventDestinationDialog>
      </PageHeader>
      <DataTable
        emptyStateTextTitle={t('Nothing is listening yet')}
        emptyStateTextDescription={t(
          'Send events to a URL you own, or to a flow that routes them on to Slack, email or a ticket.',
        )}
        emptyStateIcon={
          <EmptyMedia variant="icon">
            <Webhook />
          </EmptyMedia>
        }
        columns={eventDestinationColumns({ eventLabels })}
        page={{ data: rows, next: null, previous: null }}
        hidePagination={true}
        isLoading={!isSample && isLoading}
        isError={false}
        errorStateEntity={t('destinations')}
        actions={[
          (row) => (
            <EventDestinationActions
              destination={row.destination}
              flowId={
                row.parsed.kind === 'flow' ? row.parsed.flowId : undefined
              }
            />
          ),
        ]}
      />
    </Page>
  );
};

export default EventDestinationsPage;
