import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { folkAuth } from '../common/common';
import { folkApiCall, WebhookResponse } from '../common/common';
import { HttpMethod } from '@activepieces/pieces-common';

export const companyRemovedTrigger = createTrigger({
  auth: folkAuth,
  name: 'company_removed',
  displayName: 'Company Removed',
  description: 'Triggers when a company is deleted from the workspace or removed from a group',
  props: {},
  type: TriggerStrategy.WEBHOOK,
  sampleData: {
    id: 'cmp_8c18c158-d49e-4ad4-90d4-2b197688bac7',
    name: 'Acme Corporation',
    deletedAt: '2024-10-28T09:00:00.000Z',
  },
  async onEnable(context) {
    const webhookResponse = await folkApiCall<WebhookResponse>({
      apiKey: context.auth,
      method: HttpMethod.POST,
      endpoint: '/webhooks',
      body: {
        name: `Activepieces - Company Removed (${context.webhookUrl})`,
        targetUrl: context.webhookUrl,
        subscribedEvents: [
          {
            eventType: 'company.deleted',
            filter: {}
          }
        ]
      }
    });

    await context.store.put('_company_removed_webhook_id', {
      webhookId: webhookResponse.data.id
    });
  },
  async onDisable(context) {
    const webhookData = await context.store.get<{ webhookId: string }>('_company_removed_webhook_id');

    if (webhookData?.webhookId) {
      try {
        await folkApiCall({
          apiKey: context.auth,
          method: HttpMethod.DELETE,
          endpoint: `/webhooks/${webhookData.webhookId}`
        });
      } catch (error) {
        console.error('Error deleting webhook:', error);
      }
    }
  },
  async run(context) {
    return [context.payload.body];
  },
});