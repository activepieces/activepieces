import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';

import { replyIoAuth } from '../auth';
import { replyIoRequest } from '../common/client';

export const markRepliedAction = createAction({
  name: 'mark_replied',
  displayName: 'Mark Contact as Replied',
  description:
    'Record that a contact has replied to your outreach. This stops further follow-up emails to that contact across all active campaigns.',
  audience: 'both',
  aiMetadata: { description: 'Mark a contact (by email) as having replied, which stops further follow-up emails to them across all active campaigns. Use when a reply has been detected and outreach should pause for that reason specifically (vs. Mark Contact as Finished, which closes them out as fully completed). Requires only the contact email. Idempotent: repeating leaves the contact in the replied state.', idempotent: true },
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
