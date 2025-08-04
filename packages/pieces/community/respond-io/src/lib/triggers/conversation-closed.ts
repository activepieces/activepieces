import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { isNil } from '@activepieces/shared';

import { respondIoAuth } from '../common/auth';
import { respondIoApiCall } from '../common/client';

const TRIGGER_KEY = 'respond-io-conversation-closed';

export const conversationClosedTrigger = createTrigger({
  auth: respondIoAuth,
  name: 'conversation_closed',
  displayName: 'Conversation Closed',
  description: 'Triggers when a conversation is closed.',
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
          event_types: ['conversation.closed'],
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
      conversation: Record<string, unknown>;
    };

    if (payload.event_type !== 'conversation.closed') return [];

    return [payload];
  },

  async test() {
    return [
      {
        event_type: 'conversation.closed',
        event_id: '563eddae-a807-48b8-9a8a-f02dc3bc25cc',
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
          category: 'sampleCategory',
          summary: 'sample summary',
          openedTime: 1663274081,
          openedBySource: 'user',
          closedTime: 1663274081,
          closedBy: {
            id: null,
            firstName: null,
            lastName: null,
            email: null,
          },
          closedBySource: 'api',
          firstResponseTime: 1663274081,
          resolutionTime: 1663274081,
          incomingMessageCount: 10,
          outgoingMessageCount: 5,
          assigneeTeam: 'My team',
          lastAssignmentTime: 1663274081,
        },
      },
    ];
  },

  sampleData: {},
});
