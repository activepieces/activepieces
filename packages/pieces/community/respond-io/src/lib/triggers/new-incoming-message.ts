import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { isNil } from '@activepieces/shared';

import { respondIoAuth } from '../common/auth';
import { respondIoApiCall } from '../common/client';

const TRIGGER_KEY = 'respond-io-message-received';

export const newIncomingMessageTrigger = createTrigger({
  auth: respondIoAuth,
  name: 'new_incoming_message',
  displayName: 'New Incoming Message',
  description: 'Triggers when a new message is received from a contact.',
  type: TriggerStrategy.WEBHOOK,
  props: {},

  async onEnable(context) {
    try {
      const response = await respondIoApiCall<{
        data: { id: string; url: string };
      }>({
        method: HttpMethod.POST,
        url: '/webhooks',
        auth: context.auth,
        body: {
          url: context.webhookUrl,
          event_types: ['message.received'],
        },
      });

      await context.store.put<string>(TRIGGER_KEY, response.data.id);
    } catch (error) {
      throw new Error(`Failed to register webhook: ${(error as Error).message}`);
    }
  },

  async onDisable(context) {
    const webhookId = await context.store.get<string>(TRIGGER_KEY);

    if (!isNil(webhookId)) {
      try {
        await respondIoApiCall({
          method: HttpMethod.DELETE,
          url: `/webhooks/${webhookId}`,
          auth: context.auth,
        });
      } catch (error) {
        console.warn(`Warning: Failed to delete webhook ${webhookId}:`, (error as Error).message);
      } finally {
        await context.store.delete(TRIGGER_KEY);
      }
    }
  },

  async run(context) {
    const payload = context.payload.body as {
      event_type: string;
      contact: Record<string, unknown>;
      message: Record<string, unknown>;
      channel: Record<string, unknown>;
    };

    if (payload.event_type !== 'message.received') return [];

    return [payload];
  },

  async test() {
    // Respond.io API doesn't provide a standard "get recent message" endpoint for webhook simulation,
    // so we return a static example based on their docs.
    return [
      {
        event_type: 'message.received',
        event_id: 'test-event-id',
        contact: {
          id: 1,
          firstName: 'John',
          lastName: 'Doe',
          phone: '+60123456789',
          email: 'johndoe@sample.com',
          language: 'en',
          profilePic: 'https://cdn.chatapi.net/johndoe.png',
          countryCode: 'MY',
          status: 'open',
          assignee: {
            id: 2,
            email: 'johndoe@sample.com',
            firstName: 'John',
            lastName: 'Doe',
          },
          created_at: 1717558775,
          lifecycle: 'Hot Lead',
        },
        message: {
          messageId: 1726740558441000,
          channelMessageId: 123,
          contactId: 123,
          channelId: 123,
          traffic: 'incoming',
          timestamp: 1726740558441,
          message: {
            type: 'text',
            text: 'Message text',
            messageTag: 'ACCOUNT_UPDATE',
          },
        },
        channel: {
          id: 1,
          name: 'Facebook',
          source: 'facebook',
          meta: '{}',
          created_at: 1701403960,
        },
      },
    ];
  },

  sampleData: {},
});
