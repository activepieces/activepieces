import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { kommoAuth } from '../../index';
import { makeRequest } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const newTaskCreatedTrigger = createTrigger({
  auth: kommoAuth,
  name: 'new_task_created',
  displayName: 'New Task Created',
  description: 'Triggered when a new task is created.',
  type: TriggerStrategy.WEBHOOK,
  props: {},
  async onEnable(context) {
    const { subdomain, apiToken } = context.auth as { subdomain: string; apiToken: string };

    const webhook = await makeRequest(
      { subdomain, apiToken },
      HttpMethod.POST,
      `/webhooks`,
      {
        destination: context.webhookUrl,
        settings: ['add_task']
      }
    );

    await context.store.put('webhookId', webhook.id);
  },

  async onDisable(context) {
    const { subdomain, apiToken } = context.auth as { subdomain: string; apiToken: string };
    const webhookId = await context.store.get('webhookId');

    if (webhookId) {
      await makeRequest(
        { subdomain, apiToken },
        HttpMethod.DELETE,
                `/webhooks`,
        {destination:context.webhookUrl}
      );
    }
  },

  async run(context) {
    const { subdomain, apiToken } = context.auth as { subdomain: string; apiToken: string };

    const payload = context.payload.body as { task: { add: { id: number }[] } }
    const taskId = payload.task.add[0].id;
    if (!taskId) return [];


    const response = await makeRequest({ apiToken, subdomain }, HttpMethod.GET, `/tasks/${taskId}`)
    return [response]
  },
  sampleData: {
    "id": 12040,
    "created_by": 13290567,
    "updated_by": 13290567,
    "created_at": 1748805952,
    "updated_at": 1748805952,
    "responsible_user_id": 13290567,
    "group_id": 0,
    "entity_id": 722830,
    "entity_type": "contacts",
    "duration": 0,
    "is_completed": false,
    "task_type_id": 1,
    "text": "Test",
    "result": [],
    "complete_till": 1748975340,
    "account_id": 34678947,
    "_links": {
      "self": {
        "href": ""
      }
    }
  }
});
