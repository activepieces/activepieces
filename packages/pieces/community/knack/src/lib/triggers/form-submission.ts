import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { KnackAuth } from '../auth';
import { knackCommon } from '../common';
import { knackClient } from '../client';

export const formSubmission = createTrigger({
  name: 'form_submission',
  displayName: 'Form Submission',
  description: 'Triggers when a form is submitted',
  type: TriggerStrategy.WEBHOOK,
  sampleData: {
    id: '1234',
    formId: 'view_123',
    field_123: 'sample value',
    timestamp: '2023-09-25T12:00:00Z'
  },
  props: {
    authentication: Property.CustomAuth({
      required: true,
      description: 'Knack authentication details'
    }),
    objectId: knackCommon.object.required,
    viewId: Property.ShortText({
      displayName: 'View ID',
      description: 'The ID of the form view',
      required: true
    })
  },
  async onEnable(context) {
    const client = knackClient(context.propsValue.authentication);
    // Register webhook
    const response = await client.post('/v1/applications/webhook', {
      event: 'form_submission',
      object_id: context.propsValue.objectId,
      view_id: context.propsValue.viewId,
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
