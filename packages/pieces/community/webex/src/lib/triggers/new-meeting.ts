import { HttpMethod } from '@activepieces/pieces-common';
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { makeRequest } from '../common/client';
import { webexAuth } from '../common/auth';
export const newMeeting = createTrigger({
  auth: webexAuth,
  name: 'newMeeting',
  displayName: 'new meeting',
  description: 'Triggers when a new meeting is created',
  props: {},
  sampleData: {},
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    const response = await makeRequest(
      (context.auth as any).access_token,
      HttpMethod.POST,
      `/webhooks`,
      {
        event: 'created',
        resource: 'meetings',
        targetUrl: context.webhookUrl,
      }
    );

    await context.store.put<WebhookInformation>('webex_trigger_id', {
      id: response.id,
    });
  },
  async onDisable(context) {
    const response = await context.store?.get<WebhookInformation>(
      'webex_trigger_id'
    );
    if (response !== null && response !== undefined) {
      await makeRequest(
        (context.auth as any).access_token,
        HttpMethod.DELETE,
        `/webhooks/${response.id}`
      );
    }
  },
  async run(context) {
    return [context.payload.body];
  },
});

interface WebhookInformation {
  id: string;
}
