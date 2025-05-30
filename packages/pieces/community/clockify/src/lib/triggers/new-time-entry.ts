import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common';
import { workspaceIdDropdown } from '../common/props';
import { clockifyAuth } from '../../index';

export const newTimeEntryTrigger = createTrigger({
  auth: clockifyAuth,
  name: 'new_time_entry',
  displayName: 'New Time Entry',
  description: 'Triggers when a new time entry is created',
  type: TriggerStrategy.WEBHOOK,
  props: {
    workspaceId: workspaceIdDropdown,
  },
  sampleData: {
    id: 'entry_123',
    description: 'Worked on feature X',
    start: '2024-01-01T09:00:00Z',
    end: '2024-01-01T11:00:00Z'
  },

  async onEnable(context) {
    const { workspaceId } = context.propsValue;

    const webhook = await makeRequest(
      context.auth as string,
      HttpMethod.POST,
      `/workspaces/${workspaceId}/webhooks`,
      {
        name: 'Activepieces New Time Entry Trigger',
        url: context.webhookUrl,
        triggerSource: 'TIME_ENTRY',
        triggerEvent: 'NEW',
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
