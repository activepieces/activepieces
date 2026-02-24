import { apifyAuth } from '../..';
import { TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import {
  createApifyClient,
  generateIdempotencyKey,
  createStatusesProperty,
  createActorSourceProperty,
  createActorIdProperty,
  createWebhook,
  deleteWebhook,
  createWebhookSampleData,
  RunType,
} from '../common';
import { WebhookEventType } from 'apify-client';

export const watchActorRunsTrigger = createTrigger({
  auth: apifyAuth,
  name: 'watchActorRunsTrigger',
  displayName: 'Watch Actor Runs',
  description: 'Triggers a Flow on Apify Actor run events',
  type: TriggerStrategy.WEBHOOK,
  props: {
    actorSource: createActorSourceProperty(),
    actorid: createActorIdProperty(),
    statuses: createStatusesProperty(),
  },
  async onEnable(context) {
    const client = createApifyClient(context.auth.props.apikey);
    const actorId = context.propsValue.actorid;
    const statuses = context.propsValue.statuses as WebhookEventType[];
    const idempotencyKey = generateIdempotencyKey(actorId, statuses);

    const webhookId = await createWebhook(
      client,
      statuses,
      { actorId },
      context.webhookUrl,
      idempotencyKey,
    );

    await context.store.put('_actor_webhook_id', webhookId);
  },
  async onDisable(context) {
    const webhookId: string = (await context.store.get('_actor_webhook_id')) as string;
    if (webhookId) {
      const client = createApifyClient(context.auth.props.apikey);
      await deleteWebhook(client, webhookId);
      await context.store.delete('_actor_webhook_id');
    }
  },
  async run(context) {
    return [context.payload.body];
  },
  sampleData: createWebhookSampleData(RunType.ACTOR),
});

