import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';

import { replyIoAuth } from '../auth';
import { replyIoRequest } from '../common/client';

export const getContactAction = createAction({
  name: 'get_contact',
  displayName: 'Get Contact',
  description: 'Look up a contact in Reply.io by their email address and retrieve their details.',
  audience: 'both',
  aiMetadata: { description: 'Fetch a single Reply.io contact and their profile/stats by exact email address. Use to check whether a contact exists or to read their current details before acting on them. Email is required; this is a read-only lookup that is safe to retry.', idempotent: true },
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
