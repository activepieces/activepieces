import { createTrigger, getAccessTokenOrThrow, httpClient, HttpMethod, AuthenticationType } from '@activepieces/framework';
import { TriggerStrategy } from '@activepieces/shared';
import { getMailChimpServerPrefix, mailChimpAuth, mailChimpListIdDropdown } from '../common';
import { MailChimpSubscribeWebhookRequest } from '../common/types';

const WEBHOOK_DATA_STORE_KEY = 'mail_chimp_webhook_data';

export const mailChimpSubscribeTrigger = createTrigger({
  name: 'subscribe',
  displayName: 'Member subscribed to Audience',
  description: 'Runs when an Audience subscriber is added.',
  type: TriggerStrategy.WEBHOOK,
  props: {
    authentication: mailChimpAuth,
    list_id: mailChimpListIdDropdown,
  },
  sampleData: {
    'type': 'subscribe',
    'fired_at': '2009-03-26 21:35:57',
    'data': {
      'id': '8a25ff1d98',
      'list_id': 'a6b5da1054',
      'email': 'api@mailchimp.com',
      'email_type': 'html',
      'ip_opt': '10.20.10.30',
      'ip_signup': '10.20.10.30',
      'merges': {
        'EMAIL': 'api@mailchimp.com',
        'FNAME': 'Mailchimp',
        'LNAME': 'API',
        'INTERESTS': 'Group1,Group2'
      }
    }
  },

  async onEnable(context): Promise<void> {
    const accessToken = getAccessTokenOrThrow(context.propsValue.authentication);

    const server = await getMailChimpServerPrefix(accessToken);

    console.log(context.webhookUrl);

    const enabledWebhookId = await enableWebhookRequest({
      server,
      listId: context.propsValue.list_id!,
      token: accessToken,
      webhookUrl: context.webhookUrl!,
    });

    await context.store?.put<WebhookData>(WEBHOOK_DATA_STORE_KEY, {
      id: enabledWebhookId,
      listId: context.propsValue.list_id!,
    });
  },

  async onDisable(context): Promise<void> {
    const webhookData = await context.store?.get<WebhookData>(WEBHOOK_DATA_STORE_KEY);

    if (webhookData === undefined || webhookData === null) {
      return;
    }

    const token = getAccessTokenOrThrow(context.propsValue.authentication);
    const server = await getMailChimpServerPrefix(token);

    await disableWebhookRequest({
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

const enableWebhookRequest = async ({ server, token, listId, webhookUrl }: EnableTriggerRequestParams): Promise<string> => {
  const response = await httpClient.sendRequest<EnableTriggerResponse>({
    method: HttpMethod.POST,
    url: `https://${server}.api.mailchimp.com/3.0/lists/${listId}/webhooks`,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token,
    },
    body: {
      url: webhookUrl,
      events: {
        subscribe: true,
      },
      sources: {
        user: true,
        admin: true,
        api: true,
      },
    },
  });

  const { id: webhookId } = response.body;
  return webhookId;
};

const disableWebhookRequest = async ({ server, token, listId, webhookId }: DisableTriggerRequestParams): Promise<void> => {
  await httpClient.sendRequest<EnableTriggerResponse>({
    method: HttpMethod.DELETE,
    url: `https://${server}.api.mailchimp.com/3.0/lists/${listId}/webhooks/${webhookId}`,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token,
    },
  });
};

type TriggerRequestParams = {
  server: string;
  token: string;
  listId: string;
}

type EnableTriggerRequestParams = TriggerRequestParams & {
  webhookUrl: string;
};

type DisableTriggerRequestParams = TriggerRequestParams & {
  webhookId: string;
};

type WebhookData = {
  id: string;
  listId: string;
}

type EnableTriggerResponse = {
  id: string;
  url: string;
  list_id: string;
}
