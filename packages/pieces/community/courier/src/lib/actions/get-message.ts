import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { courierAuth } from '../common/auth';
import { courierApiCall } from '../common/client';

export const getMessage = createAction({
  auth: courierAuth,
  name: 'get_message',
  displayName: 'Get Message',
  description: 'Get the delivery status of a sent message by its message ID.',
  props: {
    message_id: Property.ShortText({
      displayName: 'Message ID',
      description: 'The ID of the message to check.',
      required: true,
    }),
  },
  async run(context) {
    const response = await courierApiCall<{ results: Record<string, unknown> }>({
      method: HttpMethod.GET,
      path: `/messages/${context.propsValue.message_id}`,
      apiKey: context.auth,
    });

    return response.body;
  },
});
