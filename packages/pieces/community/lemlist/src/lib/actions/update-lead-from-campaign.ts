import { createAction, Property } from '@activepieces/pieces-framework';
import { lemlistAuth } from '../common/constants';
import { campaignsDropdown } from '../common/props';
import { lemlistLeads } from '../common/requests';
import { lemlistSchemas } from '../common/schemas';

export const updateLeadFromCampaign = createAction({
  auth: lemlistAuth,
  name: 'updateLeadFromCampaign',
  classification: 'WRITE',
  displayName: 'Update Lead From Campaign',
  description: 'Updates a lead in a specific campaign. Empty fields are left unchanged.',
  audience: 'human',
  aiMetadata: {
    description:
      'Updates the details of a lead already in a Lemlist campaign, identified by campaign and lead email. Only filled fields are sent. Idempotent.',
    idempotent: true,
  },
  props: {
    campaignId: campaignsDropdown({ refreshers: ['auth'] }),
    email: Property.ShortText({
      displayName: 'Lead Email',
      description: 'The email of the lead to update.',
      required: true,
    }),
    firstName: Property.ShortText({ displayName: 'First Name', required: false }),
    lastName: Property.ShortText({ displayName: 'Last Name', required: false }),
    picture: Property.ShortText({ displayName: 'Picture URL', required: false }),
    phone: Property.ShortText({ displayName: 'Phone', required: false }),
    linkedinUrl: Property.ShortText({ displayName: 'LinkedIn URL', required: false }),
    companyName: Property.ShortText({ displayName: 'Company Name', required: false }),
    companyDomain: Property.ShortText({ displayName: 'Company Domain', required: false }),
    icebreaker: Property.LongText({ displayName: 'Icebreaker', required: false }),
    jobTitle: Property.ShortText({ displayName: 'Job Title', required: false }),
  },
  outputSchema: lemlistSchemas.leadWithWarnings,
  async run({ auth, propsValue }) {
    return lemlistLeads.updateLeadInCampaign({
      apiKey: auth.secret_text,
      campaignId: propsValue.campaignId,
      lead: propsValue.email,
      fields: {
        firstName: propsValue.firstName,
        lastName: propsValue.lastName,
        picture: propsValue.picture,
        phone: propsValue.phone,
        linkedinUrl: propsValue.linkedinUrl,
        companyName: propsValue.companyName,
        companyDomain: propsValue.companyDomain,
        icebreaker: propsValue.icebreaker,
        jobTitle: propsValue.jobTitle,
      },
    });
  },
});
