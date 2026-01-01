import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { signrequestAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const signrequestDeclined = createTrigger({
  auth: signrequestAuth,
  name: 'signrequestDeclined',
  displayName: 'signrequest declined',
  description: 'Fires when a SignRequest is declined',
  props: {},
  sampleData: {},
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    const apiKey = context.auth.secret_text;

    const body = {
      url: context.webhookUrl,
      events: ['declined'],
    };

    const response = await makeRequest(
      apiKey,
      HttpMethod.POST,
      '/webhooks/',
      body
    );
    await context.store.put('signrequest_declined_webhook', response.uuid);
  },
  async onDisable(context) {
    const apiKey = context.auth.secret_text;
    const webhookId = await context.store.get<any>(
      'signrequest_declined_webhook'
    );

    if (!webhookId) {
      console.debug('No Signrequest webhook found in store to delete');
      return;
    }

    await makeRequest(apiKey, HttpMethod.DELETE, `/webhooks/${webhookId}/`);
    await context.store.delete('signrequest_declined_webhook');
  },
  async run(context) {
    const body = context.payload.body as any;
    if (body.event_type !== 'declined') {
      return [];
    }
    return [context.payload.body];
  },
});
