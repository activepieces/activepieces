import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';

import { replyIoAuth } from '../auth';
import { replyIoRequest } from '../common/client';

export const removeFromAllCampaignsAction = createAction({
  name: 'remove_from_all_campaigns',
  displayName: 'Remove Contact from All Campaigns',
  description:
    'Remove a contact from every campaign they are enrolled in. No further emails will be sent to them. Their contact record is kept in Reply.io.',
  auth: replyIoAuth,
  props: {
    email: Property.ShortText({
      displayName: 'Contact Email Address',
      description: 'Email address of the contact to remove from all campaigns.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const response = await replyIoRequest({
      apiKey: auth.secret_text,
      method: HttpMethod.POST,
      path: '/v1/actions/removepersonfromallcampaigns',
      body: {
        email: propsValue.email,
      },
    });

    return response.body;
  },
});
