import {
  createTrigger,
  TriggerStrategy,
  Property,
} from '@activepieces/pieces-framework';
import { getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { mailchimpCommon } from '../common';
import { mailchimpAuth } from '../..';

const WEBHOOK_DATA_STORE_KEY = 'mailchimp_email_opened_webhook';

type WebhookData = { id: string; listId: string };

export const mailChimpEmailOpenedTrigger = createTrigger({
  auth: mailchimpAuth,
  name: 'email-opened',
  displayName: 'Email Opened',
  description: 'Fires when a recipient opens and email in a campaign.',
  type: TriggerStrategy.WEBHOOK,
  props: {
    list_id: mailchimpCommon.mailChimpListIdDropdown,
    campaign_id: Property.ShortText({
      displayName: 'Campaign ID (optional)',
      required: false,
    }),
  },

  sampleData: {
    type: 'open',
    fired_at: '2025-01-01 12:00:00',
    data: {
      list_id: 'abcd1234',
      campaign_id: 'xyz789',
      email: 'user@example.com',
    },
  },

  async onEnable(context) {
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
    if (!body || body.type !== 'open') return [];

    const wantCampaign = context.propsValue.campaign_id?.trim();
    if (wantCampaign && body.data?.campaign_id !== wantCampaign) return [];

    return [body];
  },
});
