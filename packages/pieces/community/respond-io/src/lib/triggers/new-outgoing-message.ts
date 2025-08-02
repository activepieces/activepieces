import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { isNil } from '@activepieces/shared';

import { respondIoAuth } from '../common/auth';
import { respondIoApiCall } from '../common/client';

const TRIGGER_KEY = 'respond-io-message-sent';

export const newOutgoingMessageTrigger = createTrigger({
  auth: respondIoAuth,
  name: 'new_outgoing_message',
  displayName: 'New Outgoing Message',
  description: 'Triggers when a message is sent from Respond.io.',
  type: TriggerStrategy.WEBHOOK,
  props: {},

  async onEnable(context) {
    const token = context.auth as unknown as string;

    try {
      const response = await respondIoApiCall<{
        data: { id: string; url: string };
      }>({
        method: HttpMethod.POST,
        url: '/webhooks',
        auth: token,
        body: {
          url: context.webhookUrl,
          event_types: ['message.sent'],
        },
      });

      await context.store.put<string>(TRIGGER_KEY, response.data.id);
    } catch (error) {
      throw new Error(`Failed to register webhook: ${(error as Error).message}`);
    }
  },

  async onDisable(context) {
    const token = context.auth as unknown as string;
    const webhookId = await context.store.get<string>(TRIGGER_KEY);

    if (!isNil(webhookId)) {
      try {
        await respondIoApiCall({
          method: HttpMethod.DELETE,
          url: `/webhooks/${webhookId}`,
          auth: token,
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

    if (payload.event_type !== 'message.sent') return [];

    return [payload];
  },

  async test() {
    return [
      {
        event_type: 'message.sent',
        event_id: '3bf5734f-4036-412b-a4de-cf72895492f2',
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
          created_at: 1663274081,
        },
        message: {
          messageId: 1262965213,
          channelMessageId: 123,
          contactId: 123,
          channelId: 123,
          traffic: 'outgoing',
          timestamp: 1662965213,
          message: {
            type: 'text',
            text: 'Message text',
          },
          status: [
            {
              value: 'pending',
              timestamp: 1662965213,
            },
            {
              value: 'failed',
              timestamp: 1662965213,
              message: 'Failed reason',
            },
          ],
        },
        channel: {
          id: 1,
          name: 'string',
          source: 'facebook',
          meta: '{}',
          created_at: 1663274081,
          lastMessageTime: 1663274123,
          lastIncomingMessageTime: 1663274134,
        },
      },
    ];
  },

  sampleData: {},
});
