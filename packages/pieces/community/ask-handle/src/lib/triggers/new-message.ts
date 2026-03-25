import {
  createTrigger,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { askHandleAuth } from '../common/auth';

const BASE_URL = 'https://dashboard.askhandle.com/api/v1';

export const newMessageTrigger = createTrigger({
  auth: askHandleAuth,
  name: 'new_message',
  displayName: 'New Message',
  description: 'Triggers when a new message is received',
  type: TriggerStrategy.WEBHOOK,
  props: {},
  sampleData: {
    uuid: 'ffb84155-5f12-4bee-bd50-3c868097e473',
    nickname: 'Mary',
    email: 'mary@example.com',
    body: 'Hello!',
    is_support_sender: false,
    sent_at: '2021-09-15T12:08:50.676405Z',
  },
  async onEnable(context) {
    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: `${BASE_URL}/webhooks/`,
        headers: {
          Authorization: `Token ${context.auth}`,
          'Content-Type': 'application/json',
        },
        body: {
          event: 'message.added',
          target: context.webhookUrl,
        },
      });

      if (response.status === 200 || response.status === 201) {
        const webhook = response.body as { uuid: string };
        await context.store.put('_askhandle_webhook_message', webhook.uuid);
      }
    } catch (error: any) {
      throw new Error(
        `Failed to enable webhook: ${error.message || String(error)}`
      );
    }
  },
  async onDisable(context) {
    try {
      const webhookId = await context.store.get<string>(
        '_askhandle_webhook_message'
      );

      if (webhookId) {
        await httpClient.sendRequest({
          method: HttpMethod.DELETE,
          url: `${BASE_URL}/webhooks/${webhookId}/`,
          headers: {
            Authorization: `Token ${context.auth}`,
            'Content-Type': 'application/json',
          },
        });

        await context.store.delete('_askhandle_webhook_message');
      }
    } catch (error: any) {
      console.warn('Failed to delete webhook during disable:', error);
    }
  },
  async run(context) {
    const payload = context.payload.body as { data: any };
    return [payload.data || payload];
  },
});

