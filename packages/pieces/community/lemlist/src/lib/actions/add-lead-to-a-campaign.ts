import { createAction, Property } from '@activepieces/pieces-framework';
import { lemlistAuth } from '../common/constants';
import { campaignsDropdown } from '../common/props';
import { lemlistApiService } from '../common/requests';

export const addLeadToACampaign = createAction({
  auth: lemlistAuth,
  name: 'addLeadToACampaign',
  displayName: 'Add Lead To A Campaign',
  description:
    'Adds a lead to a specific campaign with optional enrichment and lead details.',
  props: {
    campaignId: campaignsDropdown({ refreshers: ['auth'] }),
    email: Property.ShortText({
      displayName: 'Lead Email',
      description: 'The email of the lead to add',
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
    jobTitle: Property.ShortText({ displayName: 'Job Title', required: false }),
    deduplicate: Property.Checkbox({
      displayName: 'Deduplicate',
      description: 'Avoid adding the lead if it already exists in any campaign',
      required: false,
      defaultValue: false,
    }),
    linkedinEnrichment: Property.Checkbox({
      displayName: 'LinkedIn Enrichment',
      description: 'Run LinkedIn enrichment for this lead',
      required: false,
      defaultValue: false,
    }),
    findEmail: Property.Checkbox({
      displayName: 'Find Email',
      description: 'Try to find a verified email for this lead',
      required: false,
      defaultValue: false,
    }),
    verifyEmail: Property.Checkbox({
      displayName: 'Verify Email',
      description: 'Verify the lead’s email using debounce',
      required: false,
      defaultValue: false,
    }),
    findPhone: Property.Checkbox({
      displayName: 'Find Phone',
      description: 'Try to find a phone number for this lead',
      required: false,
      defaultValue: false,
    }),
  },
  async run({ auth, propsValue }) {
    const {
      campaignId,
      email,
      deduplicate,
      linkedinEnrichment,
      findEmail,
      verifyEmail,
      findPhone,
      ...leadData
    } = propsValue as any;

    return await lemlistApiService.addLeadToACampaign(auth, {
      campaignId,
      leadEmail: email,
      leadData,
      deduplicate,
      linkedinEnrichment,
      findEmail,
      verifyEmail,
      findPhone,
    });
  },
});
