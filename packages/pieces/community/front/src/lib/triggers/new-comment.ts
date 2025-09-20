import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { frontAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

const WEBHOOK_EVENT_TYPE = 'conversation_comment';

export const newComment = createTrigger({
  auth: frontAuth,
  name: 'new_comment',
  displayName: 'New Comment',
  description: 'Fires when a new comment is posted on a conversation in Front.',
  props: {},
  type: TriggerStrategy.WEBHOOK,
  sampleData: {
    _links: {
      self: 'https://api2.frontapp.com/comments/com_klmno789',
      related: {
        conversation: 'https://api2.frontapp.com/conversations/cnv_fghij456',
      },
    },
    id: 'com_klmno789',
    author: {
      id: 'tea_pqrst012',
      email: 'agent@example.com',
      username: 'agent_smith',
      first_name: 'Agent',
      last_name: 'Smith',
    },
    body: '<p>This is an internal note for the team.</p>',
    posted_at: 1678886400.123,
    attachments: [],
  },

  async onEnable(context) {
    const token = context.auth;
    const response = await makeRequest<{ id: string }>(
      token,
      HttpMethod.POST,
      '/events',
      {
        target_url: context.webhookUrl,
        events: [WEBHOOK_EVENT_TYPE],
      }
    );

    await context.store.put(`front_new_comment_webhook`, {
      webhookId: response.id,
    });
  },

  async onDisable(context) {
    const token = context.auth;
    const webhookData = await context.store.get<{ webhookId: string }>(
      `front_new_comment_webhook`
    );

    if (webhookData?.webhookId) {
      await makeRequest(
        token,
        HttpMethod.DELETE,
        `/events/${webhookData.webhookId}`
      );
    }
  },

  async run(context) {
    const eventPayload = context.payload.body as { payload: unknown };
    return [eventPayload.payload];
  },
});
