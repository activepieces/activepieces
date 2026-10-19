import { apifyAuth } from '../..';
import { TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import {
  createApifyClient,
  generateIdempotencyKey,
  createStatusesProperty,
  createWebhookInfoProperty,
  createTaskIdProperty,
  createWebhook,
  deleteWebhook,
  RunType,
  createWebhookSampleData,
} from '../common';
import { watchRunsTriggerOutputSchema } from '../output-schemas';

export const watchTaskRunsTrigger = createTrigger({
  auth: apifyAuth,
  name: 'watchTaskRunsTrigger',
  classification: 'READ',
  displayName: 'Watch Task Runs',
  description: 'Fires when a run of the task ends with a chosen status.',
  outputSchema: watchRunsTriggerOutputSchema,
  aiMetadata: {
    description: 'Fires when a run of the selected Apify Actor task reaches one of the chosen statuses (e.g. succeeded, failed, aborted). Use to react to a configured task finishing, delivering the run event payload via webhook.',
  },
  type: TriggerStrategy.WEBHOOK,
  props: {
    webhookInfo: createWebhookInfoProperty(),
    taskid: createTaskIdProperty(),
    statuses: createStatusesProperty(),
  },
  propertyGroups: [
    { key: 'target', display: 'section', label: 'What to Watch', icon: 'send', props: ['webhookInfo', 'taskid'] },
    { key: 'outcomes', display: 'section', label: 'When to Fire', icon: 'filter', props: ['statuses'] },
  ],
  async onEnable(context) {
    const client = createApifyClient(context.auth.props.apikey);
    const taskId = context.propsValue.taskid;
    const statuses = context.propsValue.statuses;
    const idempotencyKey = generateIdempotencyKey(taskId, statuses, context.webhookUrl);

    const webhookId = await createWebhook(
      client,
      statuses,
      { actorTaskId: taskId },
      context.webhookUrl,
      idempotencyKey,
    );

    await context.store.put('_task_webhook_id', webhookId);
  },
  async onDisable(context) {
    const webhookId = await context.store.get<string>('_task_webhook_id');
    if (webhookId) {
      const client = createApifyClient(context.auth.props.apikey);
      await deleteWebhook(client, webhookId);
      await context.store.delete('_task_webhook_id');
    }
  },
  async run(context) {
    return [context.payload.body];
  },
  sampleData: createWebhookSampleData(RunType.TASK),
});

