import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';

import { replyIoAuth } from '../auth';
import { campaignIdProp } from '../common/props';
import { replyIoRequest } from '../common/client';

export const removeFromCampaignAction = createAction({
  name: 'remove_from_campaign',
  displayName: 'Remove Contact from Campaign',
  description:
    'Stop a contact from receiving further emails in a specific campaign. The contact\'s record is kept in Reply.io.',
  audience: 'both',
  aiMetadata: { description: 'Remove a contact (by email) from one specific campaign so they stop receiving its outreach, while keeping their contact record and any other campaign enrolments intact. Use to pull a contact out of a single sequence; use Remove Contact from All Campaigns to halt every sequence at once. Requires the target campaign id and the contact email. Idempotent: repeating leaves the contact removed from that campaign.', idempotent: true },
  auth: replyIoAuth,
  props: {
    campaignId: campaignIdProp,
    email: Property.ShortText({
      displayName: 'Contact Email Address',
      description: 'Email address of the contact to remove from the campaign.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const response = await replyIoRequest({
      apiKey: auth.secret_text,
      method: HttpMethod.POST,
      path: '/v1/actions/removepersonfromcampaignbyid',
      body: {
        campaignId: Number(propsValue.campaignId),
        email: propsValue.email,
      },
    });

    return response.body;
  },
});
