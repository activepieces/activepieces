import { apifyAuth } from '../..';
import { TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import {
  createApifyClient,
  generateIdempotencyKey,
  createStatusesProperty,
  createTaskIdProperty,
  createWebhook,
  deleteWebhook,
  RunType,
  createWebhookSampleData,
} from '../common';
import { WebhookEventType } from 'apify-client';

export const watchTaskRunsTrigger = createTrigger({
  auth: apifyAuth,
  name: 'watchTaskRunsTrigger',
  displayName: 'Watch Task Runs',
  description: 'Triggers a Flow on Apify Actor task run events',
  type: TriggerStrategy.WEBHOOK,
  props: {
    taskid: createTaskIdProperty(),
    statuses: createStatusesProperty(),
  },
  async onEnable(context) {
    const client = createApifyClient(context.auth.props.apikey);
    const taskId = context.propsValue.taskid;
    const statuses = context.propsValue.statuses as WebhookEventType[];
    const idempotencyKey = generateIdempotencyKey(taskId, statuses);

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
    const webhookId: string = (await context.store.get('_task_webhook_id')) as string;
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

