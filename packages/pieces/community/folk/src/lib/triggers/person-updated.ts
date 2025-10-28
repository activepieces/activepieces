import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { folkAuth } from '../common/common';
import { HttpMethod } from '@activepieces/pieces-common';

export const personUpdatedTrigger = createTrigger({
  auth: folkAuth,
  name: 'person_updated',
  displayName: 'Person Updated',
  description: 'Triggers when a person\'s basic field (name, job title, email, URL) is updated',
  type: TriggerStrategy.WEBHOOK,
  props: {
    instructions: Property.MarkDown({
      value: `
## Setup Instructions

1. Copy the webhook URL below
2. Go to Folk Settings → Webhooks
3. Enable webhooks and paste the URL
4. Select event: **Person Updated**
5. Save the webhook configuration
      `,
    }),
  },
  sampleData: {
    event: 'person.updated',
    personId: 'per_123',
    changes: {
      name: { old: 'John Doe', new: 'Jane Doe' },
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
    if (eventType !== 'person.updated') return [];

    const data = payload?.data || payload;
    const changes = data?.changes || {};

    const basicFields = ['name', 'email', 'jobTitle', 'url', 'phone', 'description'];
    const hasBasicFieldChange = basicFields.some(field => changes[field]);

    if (!hasBasicFieldChange) return [];

    let personFull: any;

    return [{
      event: eventType,
      personId: data?.id,
      personUrl: data?.url,
      changes: changes,
      person: personFull || data,
    }];
  },
  async test(context) {
    return [{
      event: 'person.updated',
      personId: 'per_test123',
      changes: { name: { old: 'John Doe', new: 'Jane Doe' } },
    }];
  },
});