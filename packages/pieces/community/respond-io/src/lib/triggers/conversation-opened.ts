import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { isNil } from '@activepieces/shared';

import { respondIoAuth } from '../common/auth';
import { respondIoApiCall } from '../common/client';

const TRIGGER_KEY = 'respond-io-conversation-opened';

export const conversationOpenedTrigger = createTrigger({
  auth: respondIoAuth,
  name: 'conversation_opened',
  displayName: 'Conversation Opened',
  description: 'Triggers when a new conversation is opened.',
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
          event_types: ['conversation.opened'],
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
      conversation: Record<string, unknown>;
    };

    if (payload.event_type !== 'conversation.opened') return [];

    return [payload];
  },

  async test() {
    return [
      {
        event_type: 'conversation.opened',
        event_id: '8b9c2905-7a38-4aad-a6b7-b9120dc140fe',
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
            firstName: 'John',
            lastName: 'Doe',
            email: 'johndoe@sample.com',
          },
          created_at: 1663274081,
        },
        conversation: {
          source: 'api',
          conversationOpenedAt: 1663274081,
          firstIncomingMessage: 'hello',
          firstIncomingMessageChannelId: 1,
        },
      },
    ];
  },

  sampleData: {},
});
