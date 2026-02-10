import {
  createTrigger,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { askHandleAuth } from '../common/auth';

const BASE_URL = 'https://dashboard.askhandle.com/api/v1';

export const newLeadTrigger = createTrigger({
  auth: askHandleAuth,
  name: 'new_lead',
  displayName: 'New Lead',
  description: 'Triggers when a new lead is created',
  type: TriggerStrategy.WEBHOOK,
  props: {},
  sampleData: {
    uuid: 'd8a2e337-9d4d-4515-979a-6f590379848f',
    nickname: 'John',
    email: 'john@example.com',
    phone_number: '+1234567890',
    device: 'Desktop',
    from_page_title: 'Homepage',
    referrer: 'https://example.com',
    created_at: '2021-09-15T12:08:50.676405Z',
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
          event: 'lead.added',
          target: context.webhookUrl,
        },
      });

      if (response.status === 200 || response.status === 201) {
        const webhook = response.body as { uuid: string };
        await context.store.put('_askhandle_webhook_lead', webhook.uuid);
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
        '_askhandle_webhook_lead'
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

        await context.store.delete('_askhandle_webhook_lead');
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

