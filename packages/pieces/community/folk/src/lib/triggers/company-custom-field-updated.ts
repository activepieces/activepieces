import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { makeFolkRequest, folkAuth, FolkWebhook } from '../common/common';
import { HttpMethod } from '@activepieces/pieces-common';

export const companyCustomFieldUpdatedTrigger = createTrigger({
  auth: folkAuth,
  name: 'company_custom_field_updated',
  displayName: 'Company Custom Field Updated',
  description: 'Triggers when a company custom field (tag, status, text, assignee) is updated',
  type: TriggerStrategy.WEBHOOK,
  props: {
    fieldKey: Property.ShortText({
      displayName: 'Field Key',
      description: 'Only emit when this specific custom field is updated (optional)',
      required: false,
    }),
    instructions: Property.MarkDown({
      value: `
## Setup Instructions

1. Copy the webhook URL below
2. Go to Folk Settings → Webhooks
3. Enable webhooks and paste the URL
4. Select event: **Company Updated**
5. Save the webhook configuration
      `,
    }),
  },
  sampleData: {
    event: 'company.updated',
    companyId: 'com_123',
    changes: {
      customFields: {
        status: { old: 'Prospect', new: 'Customer' },
      },
    },
  },
  async onEnable(context) {
    await context.store.put('webhookUrl', context.webhookUrl);
  },
  async onDisable(context) {
    await context.store.delete('webhookUrl');
  },
  async run(context) {
    const payload: any = context.payload?.body;
    if (!payload) return [];

    const eventType = payload?.type || payload?.event;
    if (eventType !== 'company.updated') return [];

    const data = payload?.data || payload;
    const changes = data?.changes || {};
    
    // Check if custom fields were updated
    if (!changes.customFields && !changes.fields) return [];

    const wantedField = context.propsValue?.fieldKey?.trim();
    if (wantedField) {
      const customFieldChanges = changes.customFields || changes.fields || {};
      if (!customFieldChanges[wantedField]) return [];
    }

    let companyFull: any;

    return [{
      event: eventType,
      companyId: data?.id,
      companyUrl: data?.url,
      changes: changes,
      company: companyFull || data,
    }];
  },
  async test(context) {
    return [{
      event: 'company.updated',
      companyId: 'com_test123',
      changes: { customFields: { status: { old: 'Prospect', new: 'Customer' } } },
    }];
  },
});