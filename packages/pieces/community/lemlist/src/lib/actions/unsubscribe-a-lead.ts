import { createAction, Property } from '@activepieces/pieces-framework';
import { lemlistAuth } from '../common/constants';
import { campaignsDropdown } from '../common/props';
import { lemlistApiService } from '../common/requests';

export const unsubscribeALead	 = createAction({
  auth: lemlistAuth,
  name: 'unsubscribeALead',
  displayName: 'Unsubscribe a Lead',
  description: 'Unsubscribe a lead from a campaign.',
  audience: 'both',
  aiMetadata: { description: 'Unsubscribes a lead, identified by email, from a specific Lemlist campaign, stopping further emails to them in it. Use to honor an opt-out or stop contacting a lead in one campaign; requires both the campaign and the lead email. Idempotent: re-running leaves the lead unsubscribed.', idempotent: true },
  props: {
    campaignId: campaignsDropdown({ refreshers: ['auth'] }),
    email: Property.ShortText({
      displayName: 'Lead Email',
      description: 'The email of the lead to unsubscribe.',
      required: true,
    }),
  },
  async run({ auth, propsValue: { campaignId, email } }) {
    return await lemlistApiService.unsubscribeLeadFromACampaign(auth, {
      campaignId: campaignId as string,
      leadEmail: email as string,
    });
  },
});
