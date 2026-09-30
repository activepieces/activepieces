import { ApFlagId } from '@activepieces/shared';
import { useQueries } from '@tanstack/react-query';
import { t } from 'i18next';
import { Workflow } from 'lucide-react';
import { useMemo } from 'react';

import { AnimatedIconButton } from '@/components/custom/animated-icon-button';
import { Page, PageHeader } from '@/components/custom/page';
import { Panel } from '@/components/custom/panel';
import { SkeletonList } from '@/components/custom/skeleton-list';
import { PlusIcon } from '@/components/icons/plus';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
} from '@/components/ui/empty';
import { ItemGroup } from '@/components/ui/item';
import { flowsApi } from '@/features/flows';
import { flagsHooks } from '@/hooks/flags-hooks';
import { platformHooks } from '@/hooks/platform-hooks';

import { sampleData } from '../../sample-data';

import { EventDestinationDialog } from './components/event-destination-dialog';
import { EventDestinationRow } from './components/event-destination-row';
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

  return (
    <Page>
      <PageHeader
        title={t('Event Streaming')}
        description={t(
          'Send a webhook for every audit event and build fully customizable alerts on top.',
        )}
      >
        <EventDestinationDialog destination={null}>
          <AnimatedIconButton icon={PlusIcon} iconSize={20}>
            {t('New Destination')}
          </AnimatedIconButton>
        </EventDestinationDialog>
      </PageHeader>
      {isLoading && (
        <SkeletonList numberOfItems={3} className="h-14 rounded-2xl" />
      )}

      {!isLoading && parsedDestinations.length === 0 && (
        <Panel flush>
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Workflow />
              </EmptyMedia>
              <EmptyDescription>
                {t('No destinations yet. Create one to get started.')}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </Panel>
      )}

      {!isLoading && parsedDestinations.length > 0 && (
        <Panel flush>
          <ItemGroup className="px-1">
            {parsedDestinations.map(({ destination, parsed }) => (
              <EventDestinationRow
                key={destination.id}
                destination={destination}
                parsed={parsed}
                flowDisplayName={
                  parsed.kind === 'flow'
                    ? flowDisplayNameById.get(parsed.flowId)
                    : undefined
                }
                eventLabels={eventLabels}
              />
            ))}
          </ItemGroup>
        </Panel>
      )}
    </Page>
  );
};

export default EventDestinationsPage;
