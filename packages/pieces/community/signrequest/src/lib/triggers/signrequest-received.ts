import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { signrequestAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
export const signrequestReceived = createTrigger({
  auth: signrequestAuth,
  name: 'signrequestReceived',
  displayName: 'signrequest received',
  description: 'Triggers when a SignRequest is received',
  props: {},
  sampleData: {},
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    const apiKey = context.auth.secret_text;

    const body = {
      url: context.webhookUrl,
      events: ['signrequest_received'],
    };

    const response = await makeRequest(
      apiKey,
      HttpMethod.POST,
      '/webhooks/',
      body
    );
    await context.store.put('signrequest_received_webhook', response.uuid);
  },
  async onDisable(context) {
    const apiKey = context.auth.secret_text;
    const webhookId = await context.store.get<any>(
      'signrequest_received_webhook'
    );

    if (!webhookId) {
      console.debug('No Signrequest webhook found in store to delete');
      return;
    }

    await makeRequest(apiKey, HttpMethod.DELETE, `/webhooks/${webhookId}/`);
    await context.store.delete('signrequest_received_webhook');
  },
  async run(context) {
    const body = context.payload.body as any;
    if (body.event_type !== 'signrequest_received') {
      return [];
    }
    return [context.payload.body];
  },
});
