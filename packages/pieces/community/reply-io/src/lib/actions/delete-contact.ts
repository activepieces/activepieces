import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';

import { replyIoAuth } from '../auth';
import { replyIoRequest } from '../common/client';

export const deleteContactAction = createAction({
  name: 'delete_contact',
  displayName: 'Delete Contact',
  description:
    'Permanently delete a contact from Reply.io by their email address. This cannot be undone.',
  audience: 'both',
  aiMetadata: { description: 'Permanently delete a contact from Reply.io by exact email address; this also removes them from any campaigns and cannot be undone. Use only when the contact record should be erased entirely rather than just stopped (prefer the remove-from-campaign or mark actions to merely halt outreach). Repeating the call leaves the contact deleted, so it is safe to retry.', idempotent: true },
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
