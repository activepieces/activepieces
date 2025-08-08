import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { podioAuth } from '../../index';
import { podioApiCall, getAccessToken, dynamicSpaceProperty, dynamicOrgProperty } from '../common';

export const newTaskTrigger = createTrigger({
  auth: podioAuth,
  name: 'new_task',
  displayName: 'New Task',
  description: 'Fires when a new task is added to any workspace',
  props: {
    orgId: dynamicOrgProperty,
    spaceId: dynamicSpaceProperty,
  },
  sampleData: {
    type: "task.create",
    task_id: 987654321
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    const accessToken = getAccessToken(context.auth);
    const { spaceId } = context.propsValue;

    if (!spaceId) {
      throw new Error('Space selection is required to enable the New Task trigger. Please select a workspace.');
    }

    try {
      const response = await podioApiCall<{ hook_id: number }>({
        method: HttpMethod.POST,
        accessToken,
        resourceUri: `/hook/space/${spaceId}/`,
        body: {
          url: context.webhookUrl,
          type: 'task.create',
        },
      });

      if (!response.hook_id) {
        throw new Error('Failed to create webhook: No hook ID returned from Podio API.');
      }

      await context.store.put('podio_new_task_hook_id', response.hook_id);
      await context.store.put('podio_new_task_space_id', spaceId);
    } catch (error: any) {
      throw new Error(`Failed to enable New Task trigger: ${error.message || 'Unknown error occurred'}`);
    }
  },
  async onDisable(context) {
    const accessToken = getAccessToken(context.auth);
    const hookId = await context.store.get<number>('podio_new_task_hook_id');

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
      throw new Error(`Failed to disable New Task trigger: ${error.message || 'Unknown error occurred'}`);
    } finally {
      await context.store.delete('podio_new_task_hook_id');
      await context.store.delete('podio_new_task_space_id');
    }
  },
  async run(context) {
    const payload = context.payload.body;

    if (!payload || typeof payload !== 'object') {
      return [];
    }

    if (!(payload as any).type || (payload as any).type !== 'task.create') {
      return [];
    }

    if (!(payload as any).task_id) {
      return [];
    }

    return [payload];
  },
}); 