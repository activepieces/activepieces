import { TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { qwilrAuth } from '../../lib/common/auth';

const subscribeWebhook = async (auth: string, event: string, targetUrl: string) => {
  const response = await httpClient.sendRequest({
    method: HttpMethod.POST,
    url: 'https://api.qwilr.com/v1/webhooks',
    headers: {
      'Authorization': `Bearer ${auth}`,
      'Content-Type': 'application/json'
    },
    body: {
      event,
      targetUrl
    }
  });
  return response.body;
};

const unsubscribeWebhook = async (auth: string, subscriptionId: string) => {
  await httpClient.sendRequest({
    method: HttpMethod.DELETE,
    url: `https://api.qwilr.com/v1/webhooks/${subscriptionId}`,
    headers: {
      'Authorization': `Bearer ${auth}`
    }
  });
};

export const pagePreviewAcceptedTrigger = createTrigger({
  auth: qwilrAuth,
  name: 'page_preview_accepted',
  displayName: 'Page Preview Accepted',
  description: 'Triggers when a Qwilr page preview is accepted',
  type: TriggerStrategy.WEBHOOK,
  props: {},
  async onEnable(context) {
    const webhookData = await subscribeWebhook(
      context.auth.secret_text,
      'pagePreviewAccepted',
      context.webhookUrl
    );

    await context.store?.put('_page_preview_accepted_trigger', {
      subscriptionId: webhookData.id,
    });
  },
  async onDisable(context) {
    const response: { subscriptionId: string } | null = await context.store?.get('_page_preview_accepted_trigger');

    if (response !== null && response !== undefined) {
      await unsubscribeWebhook(context.auth.secret_text, response.subscriptionId);
    }
  },
  async run(context) {
    return [context.payload.body];
  },
  sampleData: {
    event: 'pagePreviewAccepted',
    idempotencyKey: 'b1c51b5b4844a81f7c3745002dbbd871fdda6cabe019961bcc79f972d924a2b0',
    page: {
      id: '6ee0f841f3cc8900090d82dc',
      metadata: {}
    }
  }
});
