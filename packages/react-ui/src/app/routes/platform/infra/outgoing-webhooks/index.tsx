import { t } from 'i18next';
import { Plus } from 'lucide-react';

import { DashboardPageHeader } from '@/components/custom/dashboard-page-header';
import { Button } from '@/components/ui/button';
import { OutgoingWebhookDialog } from '@/features/platform-admin/components/outgoing-webhook-dialog';
import { OutgoingWebhooksTable } from '@/features/platform-admin/components/outgoing-webhooks-table';
import { outgoingWebhooksHooks } from '@/features/platform-admin/lib/outgoing-webhooks-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import LockedFeatureGuard from '@/app/components/locked-feature-guard';
import { projectHooks } from '@/hooks/project-hooks';

const OutgoingWebhooksPage = () => {
  const { platform } = platformHooks.useCurrentPlatform();
  const { data: webhooks, isLoading } =
    outgoingWebhooksHooks.useOutgoingWebhooks();
  const { data: projects } = projectHooks.useProjects();

  const isEnabled = platform.plan.auditLogEnabled;
  return (
    <LockedFeatureGuard
      featureKey="AUDIT_LOGS"
      locked={!isEnabled}
      lockTitle={t('Unlock Audit Logs For this feature')}
      lockDescription={t(
        'Configure outgoing webhooks based on activities done within your account',
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
          <OutgoingWebhookDialog webhook={null} projects={projects ?? []}>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              {t('Create Webhook')}
            </Button>
          </OutgoingWebhookDialog>
        </div>

        <OutgoingWebhooksTable
          webhooks={webhooks}
          isLoading={isLoading}
          projects={projects ?? []}
        />
      </div>
    </LockedFeatureGuard>
  );
};

export default OutgoingWebhooksPage;
