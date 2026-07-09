import { createAction, Property } from '@activepieces/pieces-framework';
import { veroAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const resubscribeUser = createAction({
  auth: veroAuth,
  name: 'resubscribeUser',
  displayName: 'Resubscribe User',
  description: 'Globally resubscribe a user to all communications',
  audience: 'both',
  aiMetadata: {
    description:
      'Globally resubscribes a Vero user, identified by user ID, restoring their consent to receive all communications. Use to reverse a prior unsubscribe. Repeating the call leaves the user subscribed, so it is idempotent.',
    idempotent: true,
  },
  props: {
    id: Property.ShortText({
      displayName: 'User ID',
      description: 'The unique identifier of the user',
      required: true,
    }),
  },
  async run(context) {
    const { id } = context.propsValue;

    const response = await makeRequest(
      context.auth.secret_text,
      HttpMethod.POST,
      '/users/resubscribe',
      {
        id,
      }
    );

    return response;
  },
});
