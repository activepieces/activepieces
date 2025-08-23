import {
  createTrigger,
  TriggerStrategy,
  Property,
} from '@activepieces/pieces-framework';
import { getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { mailchimpCommon } from '../common';
import { mailchimpAuth } from '../..';

const WEBHOOK_DATA_STORE_KEY = 'mailchimp_link_clicked_webhook';

type WebhookData = { id: string; listId: string };

export const mailChimpLinkClickedTrigger = createTrigger({
  auth: mailchimpAuth,
  name: 'link_clicked',
  displayName: 'Link Clicked',
  description: 'Fires when a recipient clicks a specified link in a campaign.',
  type: TriggerStrategy.WEBHOOK,
  props: {
    list_id: mailchimpCommon.mailChimpListIdDropdown,
    campaign_id: Property.ShortText({
      displayName: 'Campaign ID (optional)',
      required: false,
    }),
    url: Property.ShortText({
      displayName: 'Link URL (optional)',
      required: false,
    }),
  },

  sampleData: {
    type: 'click',
    fired_at: '2025-01-01 12:00:00',
    data: {
      list_id: 'abcd1234',
      campaign_id: 'xyz789',
      url: 'https://example.com/some-link',
      email: 'user@example.com',
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
      events: { click: true },
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
    if (!body || body.type !== 'click') return [];

    const wantUrl = context.propsValue.url?.trim();
    if (wantUrl && body?.data.url !== wantUrl) return [];

    return [body];
  },
});
