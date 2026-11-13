import { apifyAuth } from '../..';
import { TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import {
  createApifyClient,
  generateIdempotencyKey,
  createStatusesProperty,
  createWebhookInfoProperty,
  createActorSourceProperty,
  createActorIdProperty,
  createWebhook,
  deleteWebhook,
  createWebhookSampleData,
  RunType,
} from '../common';
import { watchRunsTriggerOutputSchema } from '../output-schemas';

export const watchActorRunsTrigger = createTrigger({
  auth: apifyAuth,
  name: 'watchActorRunsTrigger',
  classification: 'READ',
  displayName: 'Watch Actor Runs',
  description: 'Fires when a run of the Actor ends with a chosen status.',
  outputSchema: watchRunsTriggerOutputSchema,
  aiMetadata: {
    description: 'Fires when a run of the selected Apify Actor reaches one of the chosen statuses (e.g. succeeded, failed, aborted). Use to react to an Actor finishing, delivering the run event payload via webhook.',
  },
  type: TriggerStrategy.WEBHOOK,
  props: {
    webhookInfo: createWebhookInfoProperty(),
    actorSource: createActorSourceProperty(),
    actorid: createActorIdProperty(),
    statuses: createStatusesProperty(),
  },
  propertyGroups: [
    { key: 'target', display: 'section', label: 'What to Watch', icon: 'send', props: ['webhookInfo', 'actorSource', 'actorid'] },
    { key: 'outcomes', display: 'section', label: 'When to Fire', icon: 'filter', props: ['statuses'] },
  ],
  async onEnable(context) {
    const client = createApifyClient(context.auth.props.apikey);
    const actorId = context.propsValue.actorid;
    const statuses = context.propsValue.statuses;
    const idempotencyKey = generateIdempotencyKey(actorId, statuses, context.webhookUrl);

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
    const webhookId = await context.store.get<string>('_actor_webhook_id');
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

