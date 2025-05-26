import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest, fetchWorkspaces } from '../common';
import { clockifyAuth } from '../../index';

export const newTimerStartedTrigger = createTrigger({
  auth: clockifyAuth,
  name: 'new_timer_started',
  displayName: 'New Timer Started',
  description: 'Triggers when a new timer is started',
  type: TriggerStrategy.WEBHOOK,
  props: {
    workspaceId: Property.Dropdown({
      displayName: 'Workspace',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Please authenticate first',
            options: [],
          };
        }

        const workspaces = await fetchWorkspaces(auth as string);
        return {
          options: workspaces.map((workspace: { id: string; name: string }) => ({
            label: workspace.name,
            value: workspace.id,
          })),
        };
      },
    }),
  },
  sampleData: {
    id: 'timer_456',
    description: 'Meeting with team',
    start: '2024-01-01T13:00:00Z',
    running: true,
    userId: 'user_abc',
    workspaceId: 'workspace_123',
  },

  async onEnable(context) {
    const { workspaceId } = context.propsValue;

    const webhook = await makeRequest(
      context.auth as string,
      HttpMethod.POST,
      `/workspaces/${workspaceId}/webhooks`,
      {
        name: 'Activepieces Timer Started Trigger',
        url: context.webhookUrl,
        triggerSource: 'TIME_ENTRY',
        triggerEvent: 'STARTED',
      }
    );

    await context.store.put('webhookId', webhook.id);
  },
  async onDisable(context) {
    const webhookId = await context.store.get('webhookId');
    const { workspaceId } = context.propsValue;

    if (webhookId) {
      await makeRequest(
        context.auth as string,
        HttpMethod.DELETE,
        `/workspaces/${workspaceId}/webhooks/${webhookId}`
      );
    }
  },
  async run(context) {
    return [context.payload.body];
  },
});
