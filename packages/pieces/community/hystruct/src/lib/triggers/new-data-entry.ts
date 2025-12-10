import {
  createTrigger,
  TriggerStrategy,
  Property,
} from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { hystructAuth } from '../common/auth';

export const newDataEntry = createTrigger({
  auth: hystructAuth,
  name: 'newDataEntry',
  displayName: 'New Data Entry',
  description: 'Triggered when a new data entry is created in Hystruct',
  props: {
    workflowId: Property.ShortText({
      displayName: 'Workflow ID',
      description: 'The Hystruct workflow ID to monitor for new entries',
      required: true,
    }),
  },
  sampleData: {},
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    const payload = {
      workflowId: context.propsValue.workflowId,
      webhookUrl: context.webhookUrl,
      events: [],
    };

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.hystruct.com/v1/integrations/webhooks/subscribe',
      headers: {
        'x-api-key': context.auth,
        'Content-Type': 'application/json',
      },
      body: payload,
    });

    await context.store?.put('webhookId', response.body?.id);
  },
  async onDisable(context) {
    const webhookId = await context.store?.get('webhookId');

    if (webhookId) {
      await httpClient.sendRequest({
        method: HttpMethod.DELETE,
        url: `https://api.hystruct.com/v1/integrations/webhooks/unsubscribe?webhookId=${webhookId}`,
        headers: {
          'x-api-key': context.auth,
        },
      });

      await context.store?.delete('webhookId');
    }
  },
  async run(context) {
    return [context.payload.body];
  },
});
