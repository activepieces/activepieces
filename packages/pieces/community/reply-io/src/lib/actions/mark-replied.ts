import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';

import { replyIoAuth } from '../auth';
import { replyIoRequest } from '../common/client';

export const markRepliedAction = createAction({
  name: 'mark_replied',
  displayName: 'Mark Contact as Replied',
  description:
    'Record that a contact has replied to your outreach. This stops further follow-up emails to that contact across all active campaigns.',
  auth: replyIoAuth,
  props: {
    email: Property.ShortText({
      displayName: 'Contact Email Address',
      description: 'Email address of the contact to mark as replied.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const response = await replyIoRequest({
      apiKey: auth.secret_text,
      method: HttpMethod.POST,
      path: '/v1/actions/markasreplied',
      body: {
        email: propsValue.email,
      },
    });

    return response.body;
  },
});
