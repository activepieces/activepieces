import { t } from 'i18next';
import { Globe } from 'lucide-react';

import { CenteredPage } from '@/app/components/centered-page';
import LockedFeatureGuard from '@/app/components/locked-feature-guard';
import { AnimatedIconButton } from '@/components/custom/animated-icon-button';
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from '@/components/custom/item';
import { PlusIcon } from '@/components/icons/plus';
import { Badge } from '@/components/ui/badge';
import { SkeletonList } from '@/components/ui/skeleton';
import { platformHooks } from '@/hooks/platform-hooks';
import { formatUtils } from '@/lib/format-utils';

import EventDestinationActions from './components/event-destination-actions';
import { EventDestinationDialog } from './components/event-destination-dialog';
import { eventDestinationsCollectionUtils } from './lib/event-destinations-collection';

const EventDestinationsPage = () => {
  const { platform } = platformHooks.useCurrentPlatform();

  const isEnabled = platform.plan.eventStreamingEnabled;
  const { data: destinations, isLoading } =
    eventDestinationsCollectionUtils.useAll(platform.plan.eventStreamingEnabled);

  return (
    <LockedFeatureGuard
      featureKey="EVENT_DESTINATIONS"
      locked={!isEnabled}
      lockTitle={t('Unlock Event Streaming')}
      lockDescription={t(
        'Configure destination URL to receive events from your platform to your external system',
      )}
    >
      <CenteredPage
        title={t('Event Streaming')}
        description={t('Configure event destinations for your platform')}
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

        {!isLoading && destinations.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-12 text-muted-foreground">
            <Globe className="size-10" />
            <p className="text-sm">
              {t('No destinations yet. Create one to get started.')}
            </p>
          </div>
        )}

        {!isLoading && destinations.length > 0 && (
          <ItemGroup className="gap-2">
            {destinations.map((destination) => (
              <Item key={destination.id} variant="outline">
                <ItemMedia variant="icon">
                  <Globe />
                </ItemMedia>
                <ItemContent>
                  <ItemTitle className="font-mono text-xs truncate">
                    {destination.url}
                  </ItemTitle>
                  <ItemDescription className="text-xs !flex flex-wrap items-center gap-x-1 gap-y-2 overflow-visible [text-wrap:unset] mt-1">
                    <span className="text-muted-foreground shrink-0 mr-1.5">{t('Events')}</span>
                    {destination.events.map((event) => (
                      <Badge key={event} variant="outline" className="text-xs">
                        {event}
                      </Badge>
                    ))}
                  </ItemDescription>
                  <p className="text-xs text-muted-foreground mt-2">
                    {t('Created')} {formatUtils.formatDateToAgo(new Date(destination.created))}
                  </p>
                </ItemContent>
                <ItemActions>
                  <EventDestinationActions destination={destination} />
                </ItemActions>
              </Item>
            ))}
          </ItemGroup>
        )}
      </CenteredPage>
    </LockedFeatureGuard>
  );
};

export default EventDestinationsPage;
