import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { makeFolkRequest, FolkCompany, FolkWebhook, folkAuth } from '../common/common';
import { HttpMethod } from '@activepieces/pieces-common';

export const companyUpdatedTrigger = createTrigger({
  auth: folkAuth,
  name: 'company_updated',
  displayName: 'Company Updated',
  description: 'Triggers when a company\'s basic field (e.g., name, email, or URL) in a group is updated',
  props: {
    groupId: Property.ShortText({
      displayName: 'Group ID',
      description: 'Specific group ID to monitor',
      required: false,
    }),
  },
  type: TriggerStrategy.WEBHOOK,
  sampleData: {
    id: 'comp_123456',
    type: 'company',
    name: 'Acme Corporation',
    emails: ['contact@acme.com'],
    urls: ['https://acme.com'],
    updated_fields: ['name', 'emails'],
    updated_at: '2025-01-02T00:00:00Z',
  },
  async onEnable(context) {
    const webhookUrl = context.webhookUrl;
    
    const webhookData = {
      url: webhookUrl,
      events: ['company.updated'],
      active: true,
    };

    const response = await makeFolkRequest<{ webhook: FolkWebhook }>(
      context.auth,
      HttpMethod.POST,
      '/webhooks',
      webhookData
    );

    await context.store.put('webhookId', response.webhook.id);
  },
  async onDisable(context) {
    const webhookId = await context.store.get<string>('webhookId');
    
    if (webhookId) {
      await makeFolkRequest(
        context.auth,
        HttpMethod.DELETE,
        `/webhooks/${webhookId}`
      );
      await context.store.delete('webhookId');
    }
  },
  async run(context) {
    const payload = context.payload.body as any;
    
    if (payload.type === 'company' && payload.event === 'updated') {
      const company = payload.data as FolkCompany;
      
      // Filter by group if specified
      if (context.propsValue.groupId) {
        if (!company.groups?.includes(context.propsValue.groupId)) {
          return [];
        }
      }
      
      return [
        {
          data: {
            company,
            updated_fields: payload.updated_fields,
            updated_at: payload.updated_at,
          },
        },
      ];
    }

    return [];
  },
});