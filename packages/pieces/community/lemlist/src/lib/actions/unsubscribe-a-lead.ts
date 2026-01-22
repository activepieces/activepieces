import { createAction, Property } from '@activepieces/pieces-framework';
import { lemlistAuth } from '../common/constants';
import { campaignsDropdown } from '../common/props';
import { lemlistApiService } from '../common/requests';

export const unsubscribeALead	 = createAction({
  auth: lemlistAuth,
  name: 'unsubscribeALead',
  displayName: 'Unsubscribe a Lead',
  description: 'Unsubscribe a lead from a campaign.',
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
