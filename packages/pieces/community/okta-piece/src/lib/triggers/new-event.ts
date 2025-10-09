import {
  createTrigger,
  TriggerStrategy,
  Property,
} from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { oktaAuth } from '../../index';

export const newEvent = createTrigger({
  auth: oktaAuth,
  name: 'new_event',
  displayName: 'New Event',
  description: 'Fires when a new Okta event is generated',
  type: TriggerStrategy.WEBHOOK,
  props: {
    eventTypes: Property.Array({
      displayName: 'Event Types',
      description: 'The event types to subscribe to (e.g., user.lifecycle.create, user.lifecycle.activate)',
      required: true,
    }),
  },
  sampleData: {
    eventType: 'user.lifecycle.create',
    eventId: 'sample-event-id',
    published: '2024-01-01T00:00:00.000Z',
    data: {
      events: [
        {
          uuid: 'sample-uuid',
          published: '2024-01-01T00:00:00.000Z',
          eventType: 'user.lifecycle.create',
          version: '0',
          displayMessage: 'User created',
          severity: 'INFO',
          actor: {
            id: 'sample-actor-id',
            type: 'User',
            alternateId: 'admin@example.com',
            displayName: 'Admin User',
          },
          target: [
            {
              id: 'sample-user-id',
              type: 'User',
              alternateId: 'user@example.com',
              displayName: 'New User',
            },
          ],
        },
      ],
    },
  },
  async onEnable(context) {
    const { domain, apiToken } = context.auth;
    const { eventTypes } = context.propsValue;

    const eventHook = {
      name: `Activepieces Event Hook - ${context.webhookUrl.substring(context.webhookUrl.length - 8)}`,
      events: {
        type: 'EVENT_TYPE',
        items: eventTypes,
      },
      channel: {
        type: 'HTTP',
        version: '1.0.0',
        config: {
          uri: context.webhookUrl,
          headers: [],
        },
      },
    };

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `https://${domain}/api/v1/eventHooks`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `SSWS ${apiToken}`,
      },
      body: eventHook,
    });

    await context.store.put('_event_hook_id', response.body.id);
  },
  async onDisable(context) {
    const { domain, apiToken } = context.auth;
    const eventHookId = await context.store.get('_event_hook_id');

    if (eventHookId) {
      await httpClient.sendRequest({
        method: HttpMethod.DELETE,
        url: `https://${domain}/api/v1/eventHooks/${eventHookId}`,
        headers: {
          Authorization: `SSWS ${apiToken}`,
        },
      });
    }
  },
  async run(context) {
    return [context.payload.body];
  },
});
