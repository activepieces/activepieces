import {
  createTrigger,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { askHandleAuth } from '../common/auth';

const BASE_URL = 'https://dashboard.askhandle.com/api/v1';

export const newRoomTrigger = createTrigger({
  auth: askHandleAuth,
  name: 'new_room',
  displayName: 'New Room',
  description: 'Triggers when a new room is created',
  type: TriggerStrategy.WEBHOOK,
  props: {},
  sampleData: {
    uuid: 'de1e39a5-a391-4d7f-836d-cf3589529af8',
    label: 'room-label-123',
    name: 'Customer Support Room',
    rating: 5,
    is_bot_use: false,
    created_at: '2021-09-15T12:08:50.676405Z',
    messages: [],
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
          event: 'chat.added',
          target: context.webhookUrl,
        },
      });

      if (response.status === 200 || response.status === 201) {
        const webhook = response.body as { uuid: string };
        await context.store.put('_askhandle_webhook_room', webhook.uuid);
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
        '_askhandle_webhook_room'
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

        await context.store.delete('_askhandle_webhook_room');
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

