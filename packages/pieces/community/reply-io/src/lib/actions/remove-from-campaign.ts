import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';

import { replyIoAuth } from '../auth';
import { campaignIdProp } from '../common/props';
import { replyIoRequest } from '../common/client';

export const removeFromCampaignAction = createAction({
  name: 'remove_from_campaign',
  displayName: 'Remove from Campaign',
  description: 'Remove a contact from a Reply.io campaign.',
  auth: replyIoAuth,
  props: {
    campaignId: campaignIdProp,
    email: Property.ShortText({
      displayName: 'Contact Email',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const response = await replyIoRequest({
      apiKey: auth.props.api_key,
      method: HttpMethod.POST,
      path: '/v1/actions/removepersonfromcampaignbyid',
      body: {
        campaignId: propsValue.campaignId,
        email: propsValue.email,
      },
    });

    return response.body;
  },
});
