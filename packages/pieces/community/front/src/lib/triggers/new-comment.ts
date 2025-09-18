import {
  createTrigger,
  TriggerStrategy,
  Property,
} from '@activepieces/pieces-framework';
import { frontAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { inboxDropdown } from '../common/props';

interface WebhookInformation {
  webhookId: string;
}

export const newComment = createTrigger({
  auth: frontAuth,
  name: 'new_comment',
  displayName: 'New Comment',
  description: 'Fires when a new comment is posted on a conversation in Front.',
  props: {
    inbox_id: inboxDropdown,
  },
  type: TriggerStrategy.WEBHOOK,
  sampleData: {
    _links: {
      self: 'https://api2.frontapp.com/events/evt_55c8c149',
    },
    id: 'evt_55c8c149',
    type: 'conversation_comment',
    status: 'delivered',
    target: {
      _links: {
        related: {
          conversation: 'https://api2.frontapp.com/conversations/cnv_55c8c149',
        },
      },
      data: {
        id: 'com_55c8c149',
        author: { id: 'tea_55c8c149', email: 'leela@planet-express.com' },
        body: '@bender, I thought you were supposed to be cooking for this party.',
        posted_at: 1453770984.123,
      },
    },
    conversation: {
      _links: { self: 'https://api2.frontapp.com/conversations/cnv_55c8c149' },
      id: 'cnv_55c8c149',
      subject: 'Your delivery is here!',
      status: 'archived',
      assignee: { id: 'tea_55c8c149', email: 'leela@planet-express.com' },
      inbox_id: 'inb_12345',
    },
    source: {
      _links: {},
      data: {},
    },
    made_at: 1453770984.123,
  },

  // Called when the trigger is enabled.
  async onEnable(context) {
    const response = await makeRequest<{ id: string }>(
      context.auth.toString(),
      HttpMethod.POST,
      '/events',
      {
        target_url: context.webhookUrl,
        event_types: ['conversation_comment'],
      }
    );

    await context.store.put<WebhookInformation>('_new_comment_trigger', {
      webhookId: response.id,
    });
  },

  // Called when the trigger is disabled.
  async onDisable(context) {
    const webhook = await context.store.get<WebhookInformation>(
      '_new_comment_trigger'
    );
    if (webhook?.webhookId) {
      await makeRequest(
        context.auth.toString(),
        HttpMethod.DELETE,
        `/events/${webhook.webhookId}`
      );
    }
  },


  async run(context) {
    const payload = context.payload.body as {
      target: { data: Record<string, unknown> };
      conversation: { id: string; inbox_id: string };
    };

    const inboxFilter = context.propsValue.inbox_id;


    if (inboxFilter && payload.conversation.inbox_id !== inboxFilter) {
      return [];
    }

    return [payload.target.data];
  },
});