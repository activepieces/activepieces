import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';

import { replyIoAuth } from '../auth';
import { campaignIdProp } from '../common/props';
import { replyIoRequest } from '../common/client';

export const pushToCampaignAction = createAction({
  name: 'push_to_campaign',
  displayName: 'Push Contact to Campaign',
  description:
    'Enrol an existing contact in a campaign so they start receiving outreach emails. Enable "Force Push" to move the contact even if they are already active in another campaign.',
  auth: replyIoAuth,
  props: {
    campaignId: campaignIdProp,
    email: Property.ShortText({
      displayName: 'Contact Email Address',
      description: 'Email address of the contact to add to the campaign.',
      required: true,
    }),
    forcePush: Property.Checkbox({
      displayName: 'Force Push',
      description:
        'Move the contact into this campaign even if they are already active in another campaign. Leave off to skip contacts already in an active campaign.',
      required: false,
      defaultValue: false,
    }),
  },
  async run({ auth, propsValue }) {
    const body: Record<string, unknown> = {
      campaignId: Number(propsValue.campaignId),
      email: propsValue.email,
    };

    if (propsValue.forcePush) {
      body['forcePush'] = true;
    }

    const response = await replyIoRequest({
      apiKey: auth.secret_text,
      method: HttpMethod.POST,
      path: '/v1/actions/pushtocampaign',
      body,
    });

    return response.body;
  },
});
