import { Property } from '@activepieces/pieces-framework';
import { wrikeAuth } from '../common/auth';
import { TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { WEBHOOK_ID_KEY, wrikeWebhook } from '../common/webhook';

export const newTask = createTrigger({
  name: 'new_task',
  displayName: 'New Task',
  description:
    'Fires when a new task is created in Wrike (optionally within a folder).',
  aiMetadata: {
    description: 'Fires when a new task is created in Wrike, registered via a webhook on the TaskCreated event; can be scoped to a single folder so it only fires for tasks created there.',
  },
  classification: 'READ',
  auth: wrikeAuth,
  type: TriggerStrategy.WEBHOOK,
  props: {
    folderId: Property.ShortText({
      displayName: 'Folder ID',
      description:
        'Optional: Only trigger for tasks created in this specific folder',
      required: false,
    }),
  },
  sampleData: {
    webhookId: 'IEAAABC6JAAAABAS',
    eventAuthorId: 'KUAAABKU',
    eventType: 'TaskCreated',
    taskId: 'IEAAABC6KQAB5FKW',
    lastUpdatedDate: '2016-10-10T11:33:28Z',
  },

  onEnable: async (context) => {
    const webhookId = await wrikeWebhook.register({
      auth: context.auth,
      webhookUrl: context.webhookUrl,
      eventType: 'TaskCreated',
      folderId: context.propsValue.folderId || undefined,
    });
    await context.store.put(WEBHOOK_ID_KEY, webhookId);
  },

  onDisable: async (context) => {
    await wrikeWebhook.unregister({ auth: context.auth, store: context.store });
  },

  run: async (context) => {
    return wrikeWebhook.eventsOfType({
      body: context.payload.body,
      eventType: 'TaskCreated',
    });
  },
});
