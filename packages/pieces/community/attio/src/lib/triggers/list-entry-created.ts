import { createTrigger, Property, TriggerStrategy, SecretTextProperty } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';

export const listEntryCreatedTrigger = createTrigger({
  name: 'list_entry_created',
  displayName: 'List Entry Created',
  description: 'Triggers when a new entry is added to a list in Attio',
  auth: {} as SecretTextProperty<true>,
  props: {
    list_id: Property.ShortText({
      displayName: 'List ID',
      description: 'The ID of the list to monitor',
      required: true,
    }),
  },
  type: TriggerStrategy.WEBHOOK,
  sampleData: {
    id: '123456',
    record_id: '789012',
    list_id: 'abcdef',
    attributes: {
      status: 'New Lead'
    }
  },

  async onEnable(context) {
    const { list_id } = context.propsValue;
    const response = await makeRequest(
      context.auth,
      HttpMethod.POST,
      '/webhook-subscriptions',
      {
        url: context.webhookUrl,
        events: ['list_entry.created'],
        object_id: list_id
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
