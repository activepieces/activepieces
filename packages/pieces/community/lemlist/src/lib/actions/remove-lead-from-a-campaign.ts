import { createAction, Property } from '@activepieces/pieces-framework';
import { lemlistAuth } from '../common/constants';
import { campaignsDropdown } from '../common/props';
import { lemlistApiService } from '../common/requests';

export const removeLeadFromACampaign = createAction({
  auth: lemlistAuth,
  name: 'removeLeadFromACampaign',
  displayName: 'Remove Lead from A Campaign',
  description: 'removes a lead from a specific campaign.',
  props: {
    campaignId: campaignsDropdown({ refreshers: ['auth'] }),
    email: Property.ShortText({
      displayName: 'Lead Email',
      description: 'The email of the lead to remove.',
      required: true,
    }),
  },
  async run({ auth, propsValue: { campaignId, email } }) {
    return await lemlistApiService.removeLeadFromACampaign(auth, {
      campaignId: campaignId as string,
      leadEmail: email as string,
    });
  },
});
