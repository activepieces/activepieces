import { createTrigger, TriggerStrategy, WebhookHandshakeStrategy } from '@activepieces/pieces-framework';
import { podioAuth } from '../auth';
import { podioApi } from '../common/api';
import { podioProps } from '../common/props';

export const newActivityTrigger = createTrigger({
  auth: podioAuth,
  name: 'new_activity',
  classification: 'READ',
  displayName: 'New Status',
  description: 'Fires when a new status is created in a workspace stream',
  aiMetadata: {
    description: 'Fires when a new status update is posted to the selected Podio workspace (space) stream, via a status.create webhook on that space. Represents a newly shared status update.',
  },
  props: {
    orgId: podioProps.orgId({ required: true }),
    spaceId: podioProps.spaceId({ required: true }),
  },
  sampleData: {
    type: "status.create",
    status_id: 1122334455
  },
  type: TriggerStrategy.WEBHOOK,
  handshakeConfiguration: {
    strategy: WebhookHandshakeStrategy.BODY_PARAM_PRESENT,
    paramName: 'code',
  },
  async onHandshake(context) {
    await podioApi.validateHookIfVerification({ auth: context.auth, body: context.payload.body, hookId: await context.store.get<number>('podio_new_activity_hook_id') });
    return { status: 200 };
  },
  async onEnable(context) {
    const { spaceId } = context.propsValue;

    if (!spaceId) {
      throw new Error('Space selection is required to enable the New Status trigger. Please select a workspace.');
    }

    try {
      const response = await podioApi.createHook({
        auth: context.auth,
        refType: 'space',
        refId: spaceId,
        url: context.webhookUrl,
        type: 'status.create',
      });

      if (!response.hook_id) {
        throw new Error('Failed to create webhook: No hook ID returned from Podio API.');
      }

      await context.store.put('podio_new_activity_hook_id', response.hook_id);
      await podioApi.requestHookVerification({ auth: context.auth, hookId: response.hook_id });
      await context.store.put('podio_new_activity_space_id', spaceId);
    } catch (error) {
      throw new Error(`Failed to enable New Status trigger: ${(error instanceof Error && error.message) || 'Unknown error occurred'}`);
    }
  },
  async onDisable(context) {
    const hookId = await context.store.get<number>('podio_new_activity_hook_id');

    if (!hookId) {
      return;
    }

    try {
      await podioApi.deleteHook({ auth: context.auth, hookId });
    } catch (error) {
      throw new Error(`Failed to disable New Status trigger: ${(error instanceof Error && error.message) || 'Unknown error occurred'}`);
    } finally {
      await context.store.delete('podio_new_activity_hook_id');
      await context.store.delete('podio_new_activity_space_id');
    }
  },
  async run(context) {
    const payload = context.payload.body;

    if (!payload || typeof payload !== 'object') {
      return [];
    }

    if (!('type' in payload) || payload.type !== 'status.create') {
      return [];
    }

    if (!('status_id' in payload && payload.status_id)) {
      return [];
    }

    return [payload];
  },
});
