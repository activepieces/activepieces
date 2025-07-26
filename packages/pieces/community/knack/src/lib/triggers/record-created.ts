import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { KnackAuth } from '../auth';
import { knackCommon } from '../common';
import { knackClient } from '../client';

export const recordCreated = createTrigger({
  name: 'record_created',
  displayName: 'Record Created',
  description: 'Triggers when a record is created',
  type: TriggerStrategy.WEBHOOK,
  sampleData: {
    id: '1234',
    objectId: 'object_123',
    field_123: 'sample value',
    timestamp: '2023-09-25T12:00:00Z'
  },
  props: {
    authentication: Property.CustomAuth({
      required: true,
      description: 'Knack authentication details'
    }),
    objectId: knackCommon.object.required
  },
  async onEnable(context) {
    const client = knackClient(context.propsValue.authentication);
    // Register webhook
    const response = await client.post('/v1/applications/webhook', {
      event: 'record_created',
      object_id: context.propsValue.objectId,
      callback_url: context.webhookUrl
    });

    await context.store?.put('webhookId', response.data.id);
  },
  async onDisable(context) {
    const webhookId = await context.store?.get('webhookId');
    if (webhookId) {
      const client = knackClient(context.propsValue.authentication);
      await client.delete(`/v1/applications/webhook/${webhookId}`);
    }
  },
  async run(context) {
    return [context.payload.body];
  }
});
