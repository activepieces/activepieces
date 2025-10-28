import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { makeFolkRequest, FolkPerson, folkAuth } from '../common/common';
import { HttpMethod } from '@activepieces/pieces-common';

export const personCustomFieldUpdatedTrigger = createTrigger({
  auth: folkAuth,
  name: 'person_custom_field_updated',
  displayName: 'Person Custom Field Updated',
  description: 'Triggers when a person custom field (tag, status, text, assignee) is updated',
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
4. Select event: **Person Updated**
5. Save the webhook configuration
      `,
    }),
  },
  sampleData: {
    event: 'person.updated',
    personId: 'per_123',
    changes: {
      customFields: {
        status: { old: 'Lead', new: 'Contact' },
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
    if (eventType !== 'person.updated') return [];

    const data = payload?.data || payload;
    const changes = data?.changes || {};
    
    if (!changes.customFields && !changes.fields) return [];

    const wantedField = context.propsValue?.fieldKey?.trim();
    if (wantedField) {
      const customFieldChanges = changes.customFields || changes.fields || {};
      if (!customFieldChanges[wantedField]) return [];
    }

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
      changes: { customFields: { status: { old: 'Lead', new: 'Contact' } } },
    }];
  },
});
