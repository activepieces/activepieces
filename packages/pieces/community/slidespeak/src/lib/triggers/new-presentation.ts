import { slidespeakAuth } from '../../index';
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { isNil } from '@activepieces/shared';
import { BASE_URL } from '../common/constants';

export const newPresentationTrigger = createTrigger({
  auth: slidespeakAuth,
  name: 'new-presentation',
  displayName: 'New Presentation',
  description: 'Triggers when a new presentation is created.',
  type: TriggerStrategy.WEBHOOK,
  props: {},
  async onEnable(context) {
    const apiKey = context.auth;

    const response = await httpClient.sendRequest<{ webhook_id: string }>({
      method: HttpMethod.POST,
      url: BASE_URL + '/webhook/subscribe',
      headers: {
        'X-API-key': apiKey,
      },
      body: {
        endpoint: context.webhookUrl,
      },
    });

    await context.store.put<string>('webhook_id', response.body.webhook_id);
  },
  async onDisable(context) {
    const webhookId = await context.store.get<string>('webhook_id');
    const apiKey = context.auth;

    if (!isNil(webhookId)) {
      await httpClient.sendRequest({
        method: HttpMethod.DELETE,
        url: BASE_URL + '/webhook/unsubscribe',
        headers: {
          'X-API-key': apiKey,
        },
        body: {
          webhook_id: webhookId,
        },
      });
    }
  },
  async run(context) {
    return [context.payload.body];
  },
  sampleData: {
    url: 'https://slidespeak-files.s3.us-east-2.amazonaws.com/e9c29f9f-0676-49ac-a550.pptx',
  },
});
