import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { folkApiCall, WebhookResponse, folkAuth } from '../common/common';
import { HttpMethod } from '@activepieces/pieces-common';

export const companyUpdatedTrigger = createTrigger({
  auth: folkAuth,
  name: 'company_updated',
  displayName: 'Company Updated',
  description: 'Triggers when a company\'s basic field (e.g., name, email, or URL) in a group is updated',
  props: {},
  type: TriggerStrategy.WEBHOOK,
  sampleData: {
    id: 'cmp_8c18c158-d49e-4ad4-90d4-2b197688bac7',
    name: 'Acme Corporation',
    description: 'An updated leading technology company',
    updatedAt: '2024-10-28T09:00:00.000Z',
  },
  async onEnable(context) {
    const webhookResponse = await folkApiCall<WebhookResponse>({
      apiKey: context.auth,
      method: HttpMethod.POST,
      endpoint: '/webhooks',
      body: {
        name: `Activepieces - Company Updated (${context.webhookUrl})`,
        targetUrl: context.webhookUrl,
        subscribedEvents: [
          {
            eventType: 'company.updated',
            filter: {}
          }
        ]
      }
    });

    await context.store.put('_company_updated_webhook_id', {
      webhookId: webhookResponse.data.id
    });
  },
  async onDisable(context) {
    const webhookData = await context.store.get<{ webhookId: string }>('_company_updated_webhook_id');

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