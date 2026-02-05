import { createAction, Property } from '@activepieces/pieces-framework';
import { lemlistAuth } from '../common/constants';
import { campaignsDropdown } from '../common/props';
import { lemlistApiService } from '../common/requests';

export const updateLeadFromCampaign = createAction({
  auth: lemlistAuth,
  name: 'updateLeadFromCampaign',
  displayName: 'Update Lead From Campaign',
  description:
    'Updates a lead in a specific campaign.',
  props: {
    campaignId: campaignsDropdown({ refreshers: ['auth'] }),
    email: Property.ShortText({
      displayName: 'Lead Email',
      description: 'The email of the lead to update.',
      required: true,
    }),
    firstName: Property.ShortText({
      displayName: 'First Name',
      required: false,
    }),
    lastName: Property.ShortText({ displayName: 'Last Name', required: false }),
    picture: Property.ShortText({
      displayName: 'Picture URL',
      required: false,
    }),
    phone: Property.ShortText({ displayName: 'Phone', required: false }),
    linkedinUrl: Property.ShortText({
      displayName: 'LinkedIn URL',
      required: false,
    }),
    companyName: Property.ShortText({
      displayName: 'Company Name',
      required: false,
    }),
    companyDomain: Property.ShortText({
      displayName: 'Company Domain',
      required: false,
    }),
    icebreaker: Property.LongText({
      displayName: 'Icebreaker',
      required: false,
    }),
    jobTitle: Property.ShortText({ displayName: 'Job Title', required: false })
  },
  async run({ auth, propsValue }) {
    const {
      campaignId,
      email,
      ...leadData
    } = propsValue as any;

    return await lemlistApiService.updateLeadFromCampaign(auth, {
      campaignId,
      leadEmail: email,
      leadData,
    });
  },
});
