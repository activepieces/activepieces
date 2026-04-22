import { createAction, Property } from '@activepieces/pieces-framework';
import { ninjapipeAuth } from '../auth';
import { ninjapipeDatabinRequest } from '../common/client';

export const sendToDatabin = createAction({
  auth: ninjapipeAuth,
  name: 'send_to_databin',
  displayName: 'Send to Databin',
  description: 'Send data to a NinjaPipe Databin webhook',
  props: {
    webhookUrl: Property.ShortText({
      displayName: 'Webhook URL',
      description: 'Full HTTPS webhook URL (e.g., https://www.ninjapipe.app/api/webhooks/...)',
      required: true,
    }),
    payload: Property.Json({
      displayName: 'Payload',
      description: 'Data to send to the databin',
      required: true,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const webhookUrl = propsValue.webhookUrl as string;
    const payload = propsValue.payload as Record<string, unknown>;

    const response = await ninjapipeDatabinRequest(
      auth as { base_url: string; api_key: string },
      webhookUrl,
      payload,
    );

    return response;
  },
});
