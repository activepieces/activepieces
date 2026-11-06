import { createAction, Property } from '@activepieces/pieces-framework';
import { lemlistAuth } from '../common/constants';
import { campaignsDropdown } from '../common/props';
import { lemlistLeads } from '../common/requests';
import { lemlistSchemas } from '../common/schemas';

export const addLeadToACampaign = createAction({
  auth: lemlistAuth,
  name: 'addLeadToACampaign',
  classification: 'WRITE',
  displayName: 'Add Lead To A Campaign',
  description:
    'Adds a lead to a specific campaign with optional enrichment and lead details. Enrichment options use lemlist credits.',
  audience: 'human',
  aiMetadata: {
    description:
      'Adds a lead (by email, with optional name, company, phone, LinkedIn and other details) to a Lemlist campaign, optionally running credit-spending enrichment. Not idempotent: each call creates a lead unless Deduplicate is on.',
    idempotent: false,
  },
  props: {
    campaignId: campaignsDropdown({ refreshers: ['auth'] }),
    email: Property.ShortText({
      displayName: 'Lead Email',
      description: 'The email of the lead to add',
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
    deduplicate: Property.Checkbox({
      displayName: 'Deduplicate',
      description: 'Refuse the lead if the contact is already in another campaign.',
      required: false,
      defaultValue: false,
    }),
    linkedinEnrichment: Property.Checkbox({
      displayName: 'LinkedIn Enrichment',
      description: 'Run LinkedIn enrichment for this lead. Uses lemlist credits.',
      required: false,
      defaultValue: false,
    }),
    findEmail: Property.Checkbox({
      displayName: 'Find Email',
      description: 'Try to find a verified email for this lead. Uses lemlist credits.',
      required: false,
      defaultValue: false,
    }),
    verifyEmail: Property.Checkbox({
      displayName: 'Verify Email',
      description: 'Verify the lead’s email. Uses lemlist credits.',
      required: false,
      defaultValue: false,
    }),
    findPhone: Property.Checkbox({
      displayName: 'Find Phone',
      description: 'Try to find a phone number for this lead. Uses lemlist credits.',
      required: false,
      defaultValue: false,
    }),
  },
  outputSchema: lemlistSchemas.createdLead,
  async run({ auth, propsValue }) {
    return lemlistLeads.createLeadInCampaign({
      apiKey: auth.secret_text,
      campaignId: propsValue.campaignId,
      email: propsValue.email,
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
      deduplicate: propsValue.deduplicate,
      linkedinEnrichment: propsValue.linkedinEnrichment,
      findEmail: propsValue.findEmail,
      verifyEmail: propsValue.verifyEmail,
      findPhone: propsValue.findPhone,
    });
  },
});
