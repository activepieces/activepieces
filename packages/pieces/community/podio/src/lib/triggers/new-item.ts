import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { podioAuth } from '../../index';
import { podioApiCall, getAccessToken, dynamicAppProperty } from '../common';

export const newItemTrigger = createTrigger({
  auth: podioAuth,
  name: 'new_item',
  displayName: 'New Item',
  description: 'Fires when a new item (record/entry) is created in an app',
  props: {
    appId: dynamicAppProperty,
  },
  sampleData: {
    type: "item.create",
    item_id: 1234567890,
    item_revision_id: 1,
    external_id: "external-item-123"
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    const accessToken = getAccessToken(context.auth);
    const { appId } = context.propsValue;

    if (!appId) {
      throw new Error('App selection is required to enable the New Item trigger. Please select an app.');
    }

    try {
      const response = await podioApiCall<{ hook_id: number }>({
        method: HttpMethod.POST,
        accessToken,
        resourceUri: `/hook/app/${appId}/`,
        body: {
          url: context.webhookUrl,
          type: 'item.create',
        },
      });

      if (!response.hook_id) {
        throw new Error('Failed to create webhook: No hook ID returned from Podio API.');
      }

      await context.store.put('podio_new_item_hook_id', response.hook_id);
      await context.store.put('podio_new_item_app_id', appId);
    } catch (error: any) {
      throw new Error(`Failed to enable New Item trigger: ${error.message || 'Unknown error occurred'}`);
    }
  },
  async onDisable(context) {
    const accessToken = getAccessToken(context.auth);
    const hookId = await context.store.get<number>('podio_new_item_hook_id');

    if (!hookId) {
      return;
    }

    try {
      await podioApiCall({
        method: HttpMethod.DELETE,
        accessToken,
        resourceUri: `/hook/${hookId}`,
      });
    } catch (error: any) {
      if (error.response?.status === 404) {
        return;
      }
      throw new Error(`Failed to disable New Item trigger: ${error.message || 'Unknown error occurred'}`);
    } finally {
      await context.store.delete('podio_new_item_hook_id');
      await context.store.delete('podio_new_item_app_id');
    }
  },
  async run(context) {
    const payload = context.payload.body;

    if (!payload || typeof payload !== 'object') {
      return [];
    }

    if (!(payload as any).type || (payload as any).type !== 'item.create') {
      return [];
    }

    if (!(payload as any).item_id) {
      return [];
    }

    return [payload];
  },
}); 