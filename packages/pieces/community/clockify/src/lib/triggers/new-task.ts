import {
  createTrigger,
  Property,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common';
import { clockifyAuth } from '../../index';

export const newTaskTrigger = createTrigger({
  auth: clockifyAuth,
  name: 'new_task',
  displayName: 'New Task',
  description: 'Triggers when a new task is created in Clockify',
  type: TriggerStrategy.WEBHOOK,
  props: {
    workspaceId: Property.ShortText({
      displayName: 'Workspace ID',
      required: true,
    }),
    projectId: Property.ShortText({
      displayName: 'Project ID',
      required: true,
    }),
  },
  sampleData: {
    name: 'Example Task',
    id: 'abc123',
  },

  async onEnable(context) {
    const { workspaceId, projectId } = context.propsValue;

    console.log('Creating Clockify webhook with URL:', context.webhookUrl);

    const webhook = await makeRequest(
      context.auth as string,
      HttpMethod.POST,
      `/workspaces/${workspaceId}/webhooks`,
      {
        name: `Activepieces New Task Trigger`,
        url: context.webhookUrl,
        triggerSource: 'TASK',
        triggerEvent: 'NEW',
        projectIds: [projectId],
      }
    );

    console.log('Webhook created:', webhook);

    await context.store.put('webhookId', webhook.id);
  },

  async onDisable(context) {
    const { workspaceId } = context.propsValue;
    const webhookId = await context.store.get('webhookId');

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
