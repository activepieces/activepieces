import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { makeInsightlyRequest , insightlyAuth, INSIGHTLY_OBJECTS } from '../common/common';
import { HttpMethod } from '@activepieces/pieces-common';


export const updatedRecordTrigger = createTrigger({
  auth: insightlyAuth,
  name: 'updated_record',
  displayName: 'Updated Record',
  description: 'Fires when an existing record is updated',
  type: TriggerStrategy.WEBHOOK,
  props: {
    objectType: Property.StaticDropdown({
      displayName: 'Object Type',
      description: 'The type of Insightly object to monitor',
      required: true,
      options: {
        options: INSIGHTLY_OBJECTS.map(obj => ({
          label: obj,
          value: obj,
        })),
      },
    }),
  },
  async onEnable(context) {
    const webhookUrl = context.webhookUrl;
    const objectType = context.propsValue.objectType;
    
    const webhookData = {
      OBJECT_TYPE: objectType.toUpperCase().slice(0, -1), // Remove 's' from plural
      EVENT_TYPE: 'UPDATE',
      WEBHOOK_URL: webhookUrl,
    };

    const response = await makeInsightlyRequest(
      context.auth,
      '/Webhooks',
      HttpMethod.POST,
      webhookData
    );

    await context.store.put('webhookId', response.body.WEBHOOK_ID);
  },
  async onDisable(context) {
    const webhookId = await context.store.get<number>('webhookId');
    
    if (webhookId) {
      await makeInsightlyRequest(
        context.auth,
        `/Webhooks/${webhookId}`,
        HttpMethod.DELETE
      );
    }
    
    await context.store.delete('webhookId');
  },
  async run(context) {
    return [context.payload.body];
  },
  async test(context) {
    const objectType = context.propsValue.objectType;
    const response = await makeInsightlyRequest(
      context.auth,
      `/${objectType}?top=1`
    );
    return response.body || [];
  },
  sampleData: {},
});