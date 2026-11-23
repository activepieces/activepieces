import { Property } from '@activepieces/pieces-framework';
import { wrikeAuth } from '../common/auth';
import { HttpMethod } from '@activepieces/pieces-common';
import { TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { wrikeCommon } from '../common/client';
import { WEBHOOK_ID_KEY, wrikeWebhook } from '../common/webhook';

export const newSubtask = createTrigger({
  name: 'new_subtask_created',
  displayName: 'New Subtask Created',
  description: 'Triggers when a subtask is created.',
  aiMetadata: {
    description: 'Fires when a subtask is created in Wrike, registered via a webhook on the TaskCreated event and kept only when the new task has a parent task; can be scoped to a single parent task so it only fires for subtasks added beneath it.',
  },
  classification: 'READ',
  auth: wrikeAuth,
  type: TriggerStrategy.WEBHOOK,
  props: {
    parentTaskId: Property.ShortText({
      displayName: 'Parent Task ID',
      description:
        'Optional: Only trigger for subtasks created under this specific parent task',
      required: false,
    }),
  },
  sampleData: {
    webhookId: 'IEAAABDCJAAAABAW',
    eventAuthorId: 'KUAAABKY',
    eventType: 'TaskCreated',
    taskId: 'IEAAABDCKQAB5FLC',
    lastUpdatedDate: '2024-09-05T07:22:25Z',
    task: {
      id: 'IEAAABDCKQAB5FLC',
      accountId: 'IEAAABDC',
      title: 'Draft the release notes',
      status: 'Active',
      importance: 'Normal',
      createdDate: '2024-09-05T07:22:25Z',
      updatedDate: '2024-09-05T07:22:25Z',
      parentIds: ['IEAAABDCI4AB5FLD'],
      superTaskIds: ['IEAAABDCKQAB5FLB'],
      subTaskIds: [],
      responsibleIds: ['KUAAABKY'],
      permalink: 'https://www.wrike.com/open.htm?id=1234567890',
    },
  },

  onEnable: async (context) => {
    const webhookId = await wrikeWebhook.register({
      auth: context.auth,
      webhookUrl: context.webhookUrl,
      eventType: 'TaskCreated',
    });
    await context.store.put(WEBHOOK_ID_KEY, webhookId);
  },

  onDisable: async (context) => {
    await wrikeWebhook.unregister({ auth: context.auth, store: context.store });
  },

  run: async (context) => {
    const { parentTaskId } = context.propsValue;
    const events = wrikeWebhook.eventsOfType({
      body: context.payload.body,
      eventType: 'TaskCreated',
    });
    const lookups = await Promise.allSettled(
      events.map(async (event) => {
        const response = await wrikeCommon.apiCall({
          auth: context.auth,
          method: HttpMethod.GET,
          resourceUri: `/tasks/${event.taskId}`,
        });
        const task = response.body?.data?.[0];
        const superTaskIds: string[] = task?.superTaskIds ?? [];
        const isMatch = parentTaskId
          ? superTaskIds.includes(parentTaskId)
          : superTaskIds.length > 0;
        return isMatch ? { ...event, task } : null;
      })
    );
    return lookups.flatMap((lookup) =>
      lookup.status === 'fulfilled' && lookup.value !== null ? [lookup.value] : []
    );
  },
});
