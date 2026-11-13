import { createTrigger, TriggerStrategy, WebhookHandshakeStrategy } from '@activepieces/pieces-framework';
import { podioAuth } from '../auth';
import { podioApi } from '../common/api';
import { podioProps } from '../common/props';

export const newWorkspaceTrigger = createTrigger({
  auth: podioAuth,
  name: 'member_added',
  classification: 'READ',
  displayName: 'Member Added',
  description: 'Fires when a new member is added to a workspace',
  aiMetadata: {
    description: 'Fires when a new member is added to the selected Podio workspace (space), via a member.add webhook on that space. Represents a user gaining access to the workspace.',
  },
  props: {
    orgId: podioProps.orgId({ required: true }),
    spaceId: podioProps.spaceId({ required: true }),
  },
  sampleData: {
    type: "member.add",
    space_id: 456789012,
    user_id: 234567
  },
  type: TriggerStrategy.WEBHOOK,
  handshakeConfiguration: {
    strategy: WebhookHandshakeStrategy.BODY_PARAM_PRESENT,
    paramName: 'code',
  },
  async onHandshake(context) {
    await podioApi.validateHookIfVerification({ auth: context.auth, body: context.payload.body, hookId: await context.store.get<number>('podio_member_added_hook_id') });
    return { status: 200 };
  },
  async onEnable(context) {
    const { spaceId } = context.propsValue;

    if (!spaceId) {
      throw new Error('Space selection is required to enable the Member Added trigger. Please select a workspace.');
    }

    try {
      const response = await podioApi.createHook({
        auth: context.auth,
        refType: 'space',
        refId: spaceId,
        url: context.webhookUrl,
        type: 'member.add',
      });

      if (!response.hook_id) {
        throw new Error('Failed to create webhook: No hook ID returned from Podio API.');
      }

      await context.store.put('podio_member_added_hook_id', response.hook_id);
      await podioApi.requestHookVerification({ auth: context.auth, hookId: response.hook_id });
      await context.store.put('podio_member_added_space_id', spaceId);
    } catch (error) {
      throw new Error(`Failed to enable Member Added trigger: ${(error instanceof Error && error.message) || 'Unknown error occurred'}`);
    }
  },
  async onDisable(context) {
    const hookId = await context.store.get<number>('podio_member_added_hook_id');

    if (!hookId) {
      return;
    }

    try {
      await podioApi.deleteHook({ auth: context.auth, hookId });
    } catch (error) {
      throw new Error(`Failed to disable Member Added trigger: ${(error instanceof Error && error.message) || 'Unknown error occurred'}`);
    } finally {
      await context.store.delete('podio_member_added_hook_id');
      await context.store.delete('podio_member_added_space_id');
    }
  },
  async run(context) {
    const payload = context.payload.body;

    if (!payload || typeof payload !== 'object') {
      return [];
    }

    if (!('type' in payload) || payload.type !== 'member.add') {
      return [];
    }

    if (!('space_id' in payload && payload.space_id) || !('user_id' in payload && payload.user_id)) {
      return [];
    }

    return [payload];
  },
});
