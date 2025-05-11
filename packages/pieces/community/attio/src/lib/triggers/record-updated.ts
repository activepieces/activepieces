import { createTrigger, Property, TriggerStrategy, SecretTextProperty } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';

// We'll get this from the context in the handler functions
// import { attioAuth } from '../../../index';

export const recordUpdatedTrigger = createTrigger({
  name: 'record_updated',
  displayName: 'Record Updated',
  description: 'Triggers when a record is updated in Attio',
  auth: {} as SecretTextProperty<true>,
  props: {
    object_type: Property.ShortText({
      displayName: 'Object Type',
      description: 'The type of record to monitor (e.g., person, company, deal)',
      required: true,
    }),
  },
  type: TriggerStrategy.WEBHOOK,
  sampleData: {
    id: '123456',
    attributes: {
      name: 'Updated Record',
      email: 'updated@example.com'
    }
  },

  async onEnable(context) {
    const { object_type } = context.propsValue;
    const response = await makeRequest(
      context.auth,
      HttpMethod.POST,
      '/webhook-subscriptions',
      {
        url: context.webhookUrl,
        events: ['record.updated'],
        object_id: object_type
      }
    );

    await context.store.put('webhookId', response.id);
  },

  async onDisable(context) {
    const webhookId = await context.store.get<string>('webhookId');
    if (webhookId) {
      await makeRequest(
        context.auth,
        HttpMethod.DELETE,
        `/webhook-subscriptions/${webhookId}`,
        undefined
      );
    }
  },

  async run(context) {
    if (context.payload.body) {
      return [context.payload.body];
    }
    return [];
  },
});
