import { createTrigger, TriggerStrategy, WebhookHandshakeStrategy } from '@activepieces/pieces-framework';
import { podioAuth } from '../auth';
import { podioApi } from '../common/api';
import { podioProps } from '../common/props';
import { newItemOutputSchema } from '../output-schemas';

export const newItemTrigger = createTrigger({
  auth: podioAuth,
  name: 'new_item',
  outputSchema: newItemOutputSchema,
  classification: 'READ',
  displayName: 'New Item',
  description: 'Fires when a new item (record/entry) is created in an app',
  aiMetadata: {
    description: 'Fires when a new item (record/entry) is created in the selected Podio app, via an item.create webhook on that app. Represents a newly added record.',
  },
  props: {
    appId: podioProps.appId({ required: true }),
  },
  sampleData: {
    type: "item.create",
    item_id: 1234567890,
    item_revision_id: 1,
    external_id: "external-item-123"
  },
  type: TriggerStrategy.WEBHOOK,
  handshakeConfiguration: {
    strategy: WebhookHandshakeStrategy.BODY_PARAM_PRESENT,
    paramName: 'code',
  },
  async onHandshake(context) {
    await podioApi.validateHookIfVerification({ auth: context.auth, body: context.payload.body, hookId: await context.store.get<number>('podio_new_item_hook_id') });
    return { status: 200 };
  },
  async onEnable(context) {
    const { appId } = context.propsValue;

    if (!appId) {
      throw new Error('App selection is required to enable the New Item trigger. Please select an app.');
    }

    try {
      const response = await podioApi.createHook({
        auth: context.auth,
        refType: 'app',
        refId: appId,
        url: context.webhookUrl,
        type: 'item.create',
      });

      if (!response.hook_id) {
        throw new Error('Failed to create webhook: No hook ID returned from Podio API.');
      }

      await context.store.put('podio_new_item_hook_id', response.hook_id);
      await podioApi.requestHookVerification({ auth: context.auth, hookId: response.hook_id });
      await context.store.put('podio_new_item_app_id', appId);
    } catch (error) {
      throw new Error(`Failed to enable New Item trigger: ${(error instanceof Error && error.message) || 'Unknown error occurred'}`);
    }
  },
  async onDisable(context) {
    const hookId = await context.store.get<number>('podio_new_item_hook_id');

    if (!hookId) {
      return;
    }

    try {
      await podioApi.deleteHook({ auth: context.auth, hookId });
    } catch (error) {
      throw new Error(`Failed to disable New Item trigger: ${(error instanceof Error && error.message) || 'Unknown error occurred'}`);
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

    if (!('type' in payload) || payload.type !== 'item.create') {
      return [];
    }

    if (!('item_id' in payload && payload.item_id)) {
      return [];
    }

    return [payload];
  },
});
