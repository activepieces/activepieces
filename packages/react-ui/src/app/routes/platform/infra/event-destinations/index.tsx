import { t } from 'i18next';
import { Plus } from 'lucide-react';

import { DashboardPageHeader } from '@/app/components/dashboard-page-header';
import LockedFeatureGuard from '@/app/components/locked-feature-guard';
import { Button } from '@/components/ui/button';
import { platformHooks } from '@/hooks/platform-hooks';

import { EventDestinationDialog } from './components/event-destination-dialog';
import { EventDestinationsTable } from './components/event-destinations-table';
import { eventDestinationsCollectionUtils } from './lib/event-destinations-collection';

const EventDestinationsPage = () => {
  const { platform } = platformHooks.useCurrentPlatform();

  const isEnabled = platform.plan.eventStreamingEnabled;
  const { data: destinations } = eventDestinationsCollectionUtils.useAll(
    platform.plan.eventStreamingEnabled,
  );

  return (
    <LockedFeatureGuard
      featureKey="EVENT_DESTINATIONS"
      locked={!isEnabled}
      lockTitle={t('Unlock Event Streaming')}
      lockDescription={t(
        'Configure destination URL to receive events from your platform to your external system',
      )}
    >
      <div className="flex-col w-full">
        <DashboardPageHeader
          title={t('Event Streaming')}
          description={t('Configure event destinations for your platform')}
        >
          <EventDestinationDialog destination={null}>
            <Button
              size="sm"
              className="flex items-center justify-center gap-2"
            >
              <Plus className="size-4" />
              {t('New Destination')}
            </Button>
          </EventDestinationDialog>
        </DashboardPageHeader>
        <EventDestinationsTable destinations={destinations} />
      </div>
    </LockedFeatureGuard>
  );
};

export default EventDestinationsPage;
