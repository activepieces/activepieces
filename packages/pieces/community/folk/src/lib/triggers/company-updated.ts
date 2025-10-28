import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { makeFolkRequest, FolkCompany, folkAuth } from '../common/common';
import { HttpMethod } from '@activepieces/pieces-common';

export const companyUpdatedTrigger = createTrigger({
  auth: folkAuth,
  name: 'company_updated',
  displayName: 'Company Updated',
  description: 'Triggers when a company\'s basic field (name, email, URL) is updated',
  type: TriggerStrategy.WEBHOOK,
  props: {
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
      name: { old: 'Old Name', new: 'New Name' },
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

    const basicFields = ['name', 'email', 'url', 'domain', 'description'];
    const hasBasicFieldChange = basicFields.some(field => changes[field]);

    if (!hasBasicFieldChange) return [];

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
      changes: { name: { old: 'Old Name', new: 'New Name' } },
    }];
  },
});