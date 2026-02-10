import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { signrequestAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
export const signrequestSigned = createTrigger({
  auth: signrequestAuth,
  name: 'signrequestSigned',
  displayName: 'signrequest signed',
  description: 'Triggers when a SignRequest signer is signed',
  props: {},
  sampleData: {},
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    const apiKey = context.auth.secret_text;
    const body = {
      url: context.webhookUrl,
      events: ['signer_signed'],
    };
    const response = await makeRequest(
      apiKey,
      HttpMethod.POST,
      '/webhooks/',
      body
    );
    await context.store.put('signrequest_signed_webhook', response.uuid);
  },
  async onDisable(context) {
    const apiKey = context.auth.secret_text;
    const webhookId = await context.store.get<any>(
      'signrequest_signed_webhook'
    );

    if (!webhookId) {
      console.debug('No Signrequest webhook found in store to delete');
      return;
    }

    await makeRequest(apiKey, HttpMethod.DELETE, `/webhooks/${webhookId}/`);
    await context.store.delete('signrequest_signed_webhook');
  },
  async run(context) {
    return [context.payload.body];
  },
});
