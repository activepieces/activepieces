import {
  createTrigger,
  TriggerStrategy,
  Property,
} from '@activepieces/pieces-framework';
import { getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { mailchimpCommon } from '../common';
import { mailchimpAuth } from '../..';

const WEBHOOK_DATA_STORE_KEY = 'mailchimp_new_or_updated_subscriber_webhook';

type WebhookData = { id: string; listId: string };

export const mailChimpNewOrUpdatedSubscriberTrigger = createTrigger({
  auth: mailchimpAuth,
  name: 'new-or-updated-subscriber',
  displayName: 'New or Updated Subscriber',
  description:
    'Fires when a member subscribes to an Audience or updates profile fields.',
  type: TriggerStrategy.WEBHOOK,
  props: {
    list_id: mailchimpCommon.mailChimpListIdDropdown,
    event_type: Property.StaticDropdown({
      displayName: 'Event Type (optional)',
      required: false,
      options: {
        options: [
          { label: 'Any (subscribe or profile)', value: 'any' },
          { label: 'Subscribe only', value: 'subscribe' },
          { label: 'Profile updated only', value: 'profile' },
        ],
      },
      defaultValue: 'any',
    }),
  },

  sampleData: {
    type: 'subscribe',
    fired_at: '2025-01-01 12:00:00',
    data: {
      list_id: 'abcd1234',
      email: 'user@example.com',
      merges: {
        EMAIL: 'user@example.com',
        FNAME: 'User',
        LNAME: 'Example',
      },
    },
  },

  async onEnable(context) {
    const token = getAccessTokenOrThrow(context.auth);
    const server = await mailchimpCommon.getMailChimpServerPrefix(token);

    const webhookId = await mailchimpCommon.enableWebhookRequest({
      server,
      token,
      listId: context.propsValue.list_id!,
      webhookUrl: context.webhookUrl!,
      events: {
        subscribe: true,
        profile: true,
      },
    });

    await context.store?.put<WebhookData>(WEBHOOK_DATA_STORE_KEY, {
      id: webhookId,
      listId: context.propsValue.list_id!,
    });
  },

  async onDisable(context) {
    const token = getAccessTokenOrThrow(context.auth);
    const server = await mailchimpCommon.getMailChimpServerPrefix(token);
    const data = await context.store?.get<WebhookData>(WEBHOOK_DATA_STORE_KEY);
    if (!data) return;

    await mailchimpCommon.disableWebhookRequest({
      server,
      token,
      listId: data.listId,
      webhookId: data.id,
    });
  },

  async run(context) {
    const body = context.payload.body as any;
    if (!body) return [];

    const type = body.type as string;
    if (type !== 'subscribe' && type !== 'profile') return [];

    const desired = (context.propsValue.event_type as string) || 'any';
    if (desired !== 'any' && type !== desired) return [];

    return [body];
  },
});
