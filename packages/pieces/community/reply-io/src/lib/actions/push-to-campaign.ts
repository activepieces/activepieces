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
  audience: 'both',
  aiMetadata: { description: 'Enrol an already-existing Reply.io contact (by email) into a campaign so outbound outreach begins; the optional Force Push flag moves them in even if they are already active in another campaign (otherwise such contacts are skipped). Use when the contact already exists and only needs to be added to a sequence; use Add Contact to Campaign instead if you also need to create the contact. Requires a target campaign id and the contact email. Not idempotent: it enrolls and starts sending outreach on each call.', idempotent: false },
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
