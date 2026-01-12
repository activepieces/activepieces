import { t } from 'i18next';
import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { platformHooks } from '@/hooks/platform-hooks';
import LockedFeatureGuard from '@/app/components/locked-feature-guard';
import { DashboardPageHeader } from '@/app/components/dashboard-page-header';

import { OutgoingWebhookDialog } from './components/outgoing-webhook-dialog';
import { OutgoingWebhooksTable } from './components/outgoing-webhooks-table';
import { outgoingWebhooksCollectionUtils } from './lib/outgoing-webhooks-collection';

const OutgoingWebhooksPage = () => {
  const { platform } = platformHooks.useCurrentPlatform();

  const isEnabled = platform.plan.auditLogEnabled;
  const { data: webhooks } = outgoingWebhooksCollectionUtils.useAll(platform.plan.auditLogEnabled);

  return (
    <LockedFeatureGuard
      featureKey="OUTGOING_WEBHOOKS"
      locked={!isEnabled}
      lockTitle={t('Unlock Outgoing Webhooks')}
      lockDescription={t(
        'Configure webhook URL to receive events from your platform to your external system',
      )}
    >
      <div className="flex flex-col w-full gap-4">
        <DashboardPageHeader
          title={t('Outgoing Webhooks')}
          description={t('Configure outgoing webhooks for your platform')}
        />

        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-2xl font-semibold">{t('Outgoing Webhooks')}</h2>
            <p className="text-muted-foreground">
              {t('Manage webhooks that receive platform events')}
            </p>
          </div>
          <OutgoingWebhookDialog webhook={null}>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              {t('Create Webhook')}
            </Button>
          </OutgoingWebhookDialog>
        </div>

        <OutgoingWebhooksTable webhooks={webhooks} />
      </div>
    </LockedFeatureGuard>
  );
};

export default OutgoingWebhooksPage;
