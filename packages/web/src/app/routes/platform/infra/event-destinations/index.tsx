import { ApFlagId } from '@activepieces/shared';
import { useQueries } from '@tanstack/react-query';
import { t } from 'i18next';
import { Workflow } from 'lucide-react';
import { useMemo } from 'react';

import { CenteredPage } from '@/app/components/centered-page';
import LockedFeatureGuard from '@/app/components/locked-feature-guard';
import { AnimatedIconButton } from '@/components/custom/animated-icon-button';
import { ItemGroup } from '@/components/custom/item';
import { PlusIcon } from '@/components/icons/plus';
import { SkeletonList } from '@/components/ui/skeleton';
import { flowsApi } from '@/features/flows';
import { flagsHooks } from '@/hooks/flags-hooks';
import { platformHooks } from '@/hooks/platform-hooks';

import { EventDestinationDialog } from './components/event-destination-dialog';
import { EventDestinationRow } from './components/event-destination-row';
import { eventDestinationsCollectionUtils } from './lib/event-destinations-collection';
import { parseFlowIdFromUrl } from './lib/parse-flow-id-from-url';
import { useEventLabels } from './lib/use-event-labels';

const EventDestinationsPage = () => {
  const { platform } = platformHooks.useCurrentPlatform();
  const isEnabled = platform.plan.eventStreamingEnabled;
  const { data: destinations, isLoading } =
    eventDestinationsCollectionUtils.useAll(isEnabled);
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
    <LockedFeatureGuard
      featureKey="EVENT_DESTINATIONS"
      locked={!isEnabled}
      lockTitle={t('Unlock Event Streaming')}
      lockDescription={t(
        'Forward every audit event we emit to a webhook, then handle it in a flow — wire it to Slack, Gmail, PagerDuty, or anywhere else.',
      )}
    >
      <CenteredPage
        title={t('Event Streaming')}
        description={t(
          'Send a webhook for every audit event and build fully customizable alerts on top.',
        )}
        actions={
          <EventDestinationDialog destination={null}>
            <AnimatedIconButton icon={PlusIcon} iconSize={16} size="sm">
              {t('New Destination')}
            </AnimatedIconButton>
          </EventDestinationDialog>
        }
      >
        {isLoading && (
          <SkeletonList numberOfItems={3} className="w-full h-[72px]" />
        )}

        {!isLoading && parsedDestinations.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-12 text-muted-foreground">
            <Workflow className="size-10" />
            <p className="text-sm">
              {t('No destinations yet. Create one to get started.')}
            </p>
          </div>
        )}

        {!isLoading && parsedDestinations.length > 0 && (
          <ItemGroup className="gap-2">
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
        )}
      </CenteredPage>
    </LockedFeatureGuard>
  );
};

export default EventDestinationsPage;
