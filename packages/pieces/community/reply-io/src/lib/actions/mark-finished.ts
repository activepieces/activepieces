import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';

import { replyIoAuth } from '../auth';
import { replyIoRequest } from '../common/client';

export const markFinishedAction = createAction({
  name: 'mark_finished',
  displayName: 'Mark Contact as Finished',
  description:
    'Mark a contact as finished so they no longer receive emails in any campaign. Use this when you have completed all outreach to that contact.',
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
