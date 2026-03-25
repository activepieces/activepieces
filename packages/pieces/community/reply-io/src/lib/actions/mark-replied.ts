import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';

import { replyIoAuth } from '../auth';
import { replyIoRequest } from '../common/client';

export const markRepliedAction = createAction({
  name: 'mark_replied',
  displayName: 'Mark Replied',
  description: 'Mark a contact as replied in Reply.io by email address.',
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
      path: '/v1/actions/markasreplied',
      body: {
        email: propsValue.email,
      },
    });

    return response.body;
  },
});
