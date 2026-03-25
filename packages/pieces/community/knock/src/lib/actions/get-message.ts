import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { knockAuth } from '../auth';
import { knockApiCall } from '../common/client';

export const getMessage = createAction({
  auth: knockAuth,
  name: 'get_message',
  displayName: 'Get Message',
  description: 'Retrieve a Knock message by its ID.',
  props: {
    messageId: Property.ShortText({
      displayName: 'Message ID',
      description: 'The unique identifier of the message.',
      required: true,
    }),
  },
  async run(context) {
    return knockApiCall({
      apiKey: context.auth.secret_text,
      method: HttpMethod.GET,
      path: `/messages/${encodeURIComponent(context.propsValue.messageId)}`,
    });
  },
});
