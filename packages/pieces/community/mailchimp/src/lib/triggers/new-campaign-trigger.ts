import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { mailchimpCommon } from '../common';
import { MailChimpCampaignWebhookRequest } from '../common/types';
import { mailchimpAuth } from '../..';

const WEBHOOK_DATA_STORE_KEY = 'mail_chimp_campaign_webhook_data';

type WebhookData = {
  id: string;
  listId: string;
};

export const mailChimpNewCampaignTrigger = createTrigger({
  auth: mailchimpAuth,
  name: 'new_campaign',
  displayName: 'New Campaign',
  description: 'Fires when a new campaign is created or sent.',
  type: TriggerStrategy.WEBHOOK,
  props: {
    list_id: mailchimpCommon.mailChimpListIdDropdown,
  },
  sampleData: {
    type: 'campaign',
    fired_at: '2009-03-26 21:35:57',
    data: {
      id: '42694e9e57',
      subject: 'Newsletter Campaign',
      list_id: 'a6b5da1054',
      status: 'sent',
      send_time: '2009-03-26 21:35:57',
    },
  },

  async onEnable(context): Promise<void> {
    const accessToken = getAccessTokenOrThrow(context.auth);
    const server = await mailchimpCommon.getMailChimpServerPrefix(accessToken);

    const enabledWebhookId = await mailchimpCommon.enableWebhookRequest({
      server,
      listId: context.propsValue.list_id!,
      token: accessToken,
      webhookUrl: context.webhookUrl!,
      events: { campaign: true },
    });

    await context.store?.put<WebhookData>(WEBHOOK_DATA_STORE_KEY, {
      id: enabledWebhookId,
      listId: context.propsValue.list_id!,
    });
  },

  async onDisable(context): Promise<void> {
    const webhookData = await context.store?.get<WebhookData>(
      WEBHOOK_DATA_STORE_KEY
    );

    if (webhookData === undefined || webhookData === null) {
      return;
    }

    const token = getAccessTokenOrThrow(context.auth);
    const server = await mailchimpCommon.getMailChimpServerPrefix(token);

    await mailchimpCommon.disableWebhookRequest({
      server,
      token,
      listId: webhookData.listId,
      webhookId: webhookData.id,
    });
  },

  async run(context): Promise<unknown[]> {
    const request = context.payload.body as MailChimpCampaignWebhookRequest;

    if (request === undefined) {
      return [];
    }

    return [request];
  },
});
