import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';

import { replyIoAuth } from '../auth';
import { replyIoRequest } from '../common/client';

export const getContactAction = createAction({
  name: 'get_contact',
  displayName: 'Get Contact',
  description: 'Look up a contact in Reply.io by their email address and retrieve their details.',
  auth: replyIoAuth,
  props: {
    email: Property.ShortText({
      displayName: 'Contact Email Address',
      description: 'Email address of the contact to look up.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const response = await replyIoRequest({
      apiKey: auth.secret_text,
      method: HttpMethod.GET,
      path: '/v1/people',
      queryParams: {
        email: propsValue.email,
      },
    });

    return response.body;
  },
});
