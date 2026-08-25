import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { knockAuth } from '../auth';
import { knockApiCall } from '../common/client';

export const getMessage = createAction({
  auth: knockAuth,
  name: 'get_message',
  displayName: 'Get Message',
  description: 'Retrieve a Knock message by its ID.',
  audience: 'both',
  aiMetadata: {
    description: 'Fetches a single Knock message (a delivered or queued notification instance) by its unique message ID. Choose this to inspect the status or contents of one notification. Read-only and idempotent.',
    idempotent: true,
  },
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
