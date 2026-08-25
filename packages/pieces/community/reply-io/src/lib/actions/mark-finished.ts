import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';

import { replyIoAuth } from '../auth';
import { replyIoRequest } from '../common/client';

export const markFinishedAction = createAction({
  name: 'mark_finished',
  displayName: 'Mark Contact as Finished',
  description:
    'Mark a contact as finished so they no longer receive emails in any campaign. Use this when you have completed all outreach to that contact.',
  audience: 'both',
  aiMetadata: { description: 'Mark a contact (by email) as finished so they no longer receive emails in any campaign, signalling that all outreach to them is complete. Use to close out a contact whose sequence is done (vs. Mark Contact as Replied, which pauses specifically because they responded). Requires only the contact email. Idempotent: repeating leaves the contact in the finished state.', idempotent: true },
  auth: replyIoAuth,
  props: {
    email: Property.ShortText({
      displayName: 'Contact Email Address',
      description: 'Email address of the contact to mark as finished.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const response = await replyIoRequest({
      apiKey: auth.secret_text,
      method: HttpMethod.POST,
      path: '/v1/actions/markasfinished',
      body: {
        email: propsValue.email,
      },
    });

    return response.body;
  },
});
