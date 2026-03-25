import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';

import { replyIoAuth } from '../auth';
import { replyIoRequest } from '../common/client';

export const markFinishedAction = createAction({
  name: 'mark_finished',
  displayName: 'Mark Finished',
  description: 'Mark a contact as finished in Reply.io by email address.',
  auth: replyIoAuth,
  props: {
    email: Property.ShortText({
      displayName: 'Contact Email',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const response = await replyIoRequest({
      apiKey: auth.props.api_key,
      method: HttpMethod.POST,
      path: '/v1/actions/markasfinished',
      body: {
        email: propsValue.email,
      },
    });

    return response.body;
  },
});
