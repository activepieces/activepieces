import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { mailchimpCommon } from '../common';
import { MailChimpSubscribeWebhookRequest } from '../common/types';
import { mailchimpAuth } from '../auth';

const WEBHOOK_DATA_STORE_KEY = 'mail_chimp_webhook_data';

type WebhookData = {
  id: string;
  listId: string;
};

export const mailChimpUnsubscriberTrigger = createTrigger({
  auth: mailchimpAuth,
  name: 'unsubscribe',
  displayName: 'Member Unsubscribed to Audience',
  description: 'Runs when a member unsubscribes.',
  type: TriggerStrategy.WEBHOOK,
  props: {
    list_id: mailchimpCommon.mailChimpListIdDropdown,
  },
  sampleData: {
    type: 'unsubscribe',
    fired_at: '2009-03-26 21:35:57',
    data: {
      id: '8a25ff1d98',
      list_id: 'a6b5da1054',
      email: 'api@mailchimp.com',
      email_type: 'html',
      ip_opt: '10.20.10.30',
      ip_signup: '10.20.10.30',
      merges: {
        EMAIL: 'api@mailchimp.com',
        FNAME: 'Mailchimp',
        LNAME: 'API',
        INTERESTS: 'Group1,Group2',
      },
    },
  },

  async onEnable(context): Promise<void> {
    const accessToken = getAccessTokenOrThrow(context.auth);

    const server = await mailchimpCommon.getMailChimpServerPrefix(accessToken);

    console.log(context.webhookUrl);

    const enabledWebhookId = await mailchimpCommon.enableWebhookRequest({
      server,
      listId: context.propsValue.list_id!,
      token: accessToken,
      webhookUrl: context.webhookUrl!,
      events: { subscribe: true },
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
    const request = context.payload.body as MailChimpSubscribeWebhookRequest;

    if (request === undefined) {
      return [];
    }

    return [request];
  },
});
