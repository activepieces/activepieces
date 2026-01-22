import { t } from 'i18next';
import { Plus } from 'lucide-react';

import { EventDestinationDialog } from './components/event-destination-dialog';
import { EventDestinationsTable } from './components/event-destinations-table';
import { eventDestinationsCollectionUtils } from './lib/event-destinations-collection';

import { DashboardPageHeader } from '@/app/components/dashboard-page-header';
import LockedFeatureGuard from '@/app/components/locked-feature-guard';
import { Button } from '@/components/ui/button';
import { platformHooks } from '@/hooks/platform-hooks';

const EventDestinationsPage = () => {
  const { platform } = platformHooks.useCurrentPlatform();

  const isEnabled = platform.plan.auditLogEnabled;
  const { data: destinations } = eventDestinationsCollectionUtils.useAll(
    platform.plan.eventStreamingEnabled,
  );

  return (
    <LockedFeatureGuard
      featureKey="EVENT_DESTINATIONS"
      locked={!isEnabled}
      lockTitle={t('Unlock Event Destinations')}
      lockDescription={t(
        'Configure destination URL to receive events from your platform to your external system',
      )}
    >
      <div className="flex flex-col w-full gap-4">
        <DashboardPageHeader
          title={t('Event Destinations')}
          description={t('Configure event destinations for your platform')}
        />

        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-2xl font-semibold">
              {t('Event Destinations')}
            </h2>
            <p className="text-muted-foreground">
              {t('Manage destinations that receive platform events')}
            </p>
          </div>
          <EventDestinationDialog destination={null}>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              {t('Create Destination')}
            </Button>
          </EventDestinationDialog>
        </div>

        <EventDestinationsTable destinations={destinations} />
      </div>
    </LockedFeatureGuard>
  );
};

export default EventDestinationsPage;
