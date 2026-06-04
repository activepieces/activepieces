import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';

import { replyIoAuth } from '../auth';
import { replyIoRequest } from '../common/client';

export const deleteContactAction = createAction({
  name: 'delete_contact',
  displayName: 'Delete Contact',
  description:
    'Permanently delete a contact from Reply.io by their email address. This cannot be undone.',
  auth: replyIoAuth,
  props: {
    email: Property.ShortText({
      displayName: 'Contact Email Address',
      description: 'Email address of the contact to permanently delete.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const response = await replyIoRequest({
      apiKey: auth.secret_text,
      method: HttpMethod.DELETE,
      path: '/v1/people',
      queryParams: {
        email: propsValue.email,
      },
    });

    return response.body;
  },
});
