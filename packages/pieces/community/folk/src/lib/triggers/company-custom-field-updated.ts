import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { WebhookResponse, folkAuth, folkApiCall } from '../common/common';
import { HttpMethod } from '@activepieces/pieces-common';

export const companyCustomFieldUpdatedTrigger = createTrigger({
  auth: folkAuth,
  name: 'company_custom_field_updated',
  displayName: 'Company Custom Field Updated',
  description: 'Triggers when a company custom field (e.g., tag, status, text, assignee) is updated',
  props: {},
  type: TriggerStrategy.WEBHOOK,
  sampleData: {
    id: 'cmp_8c18c158-d49e-4ad4-90d4-2b197688bac7',
    name: 'Acme Corporation',
    updatedField: 'status',
    oldValue: 'prospect',
    newValue: 'customer',
    updatedAt: '2024-10-28T09:00:00.000Z',
  },
  async onEnable(context) {
    const webhookResponse = await folkApiCall<WebhookResponse>({
      apiKey: context.auth,
      method: HttpMethod.POST,
      endpoint: '/webhooks',
      body: {
        name: `Activepieces - Company Custom Field Updated (${context.webhookUrl})`,
        targetUrl: context.webhookUrl,
        subscribedEvents: [
          {
            eventType: 'company.updated',
            filter: {}
          }
        ]
      }
    });

    await context.store.put('_company_custom_field_updated_webhook_id', {
      webhookId: webhookResponse.data.id
    });
  },
  async onDisable(context) {
    const webhookData = await context.store.get<{ webhookId: string }>('_company_custom_field_updated_webhook_id');

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