import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { ninjapipeAuth } from '../../';

export const sendToDatabin = createAction({
  auth: ninjapipeAuth,
  name: 'send_to_databin',
  displayName: 'Send to Databin',
  description: 'Sends a JSON payload to a NinjaPipe Databin webhook URL.',
  props: {
    webhookUrl: Property.ShortText({
      displayName: 'Databin Webhook URL',
      description: 'The full HTTPS webhook URL from your Databin (must contain /api/webhooks/).',
      required: true,
    }),
    payload: Property.Json({
      displayName: 'Payload',
      description: 'JSON object to send.',
      required: true,
    }),
  },
  async run(context) {
    const url = context.propsValue.webhookUrl as string;
    if (!url.match(/^https:\/\/.+\/api\/webhooks\//)) {
      throw new Error('Invalid webhook URL. Must start with https:// and contain /api/webhooks/.');
    }
    const response = await httpClient.sendRequest<Record<string, any>>({
      method: HttpMethod.POST,
      url,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: typeof context.propsValue.payload === 'string'
        ? JSON.parse(context.propsValue.payload as string)
        : context.propsValue.payload,
    });
    return response.body;
  },
});
