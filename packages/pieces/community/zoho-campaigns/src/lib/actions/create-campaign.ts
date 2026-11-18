import { propsValidation } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import * as z from 'zod/mini';
import { zohoCampaignsAuth } from '../auth';
import { zohoCampaignsApi } from '../common/api';
import { zohoCampaignsProps } from '../common/props';
import { zohoCampaignsCreateCampaignOutputSchema } from '../output-schemas';

export const createCampaignAction = createAction({
  auth: zohoCampaignsAuth,
  name: 'createCampaign',
  outputSchema: zohoCampaignsCreateCampaignOutputSchema,
  classification: 'WRITE',
  displayName: 'Create Campaign',
  description:
    'Create a new campaign with campaign name, subject, topic, sender name/address, and mailing list.',
  audience: 'human',
  aiMetadata: {
    description:
      'Creates a new draft email campaign in Zoho Campaigns with the given name, subject, sender name/address, topic, and target mailing list(s). Use to set up a campaign before sending or cloning it. Not idempotent: each call creates a separate campaign even with identical inputs.',
    idempotent: false,
  },
  props: {
    campaignname: Property.ShortText({
      displayName: 'Campaign Name',
      description: 'A name to your campaign',
      required: true,
    }),
    from_email: Property.ShortText({
      displayName: 'From Email',
      description: 'Sender email address for the campaign',
      required: true,
    }),
    subject: Property.ShortText({
      displayName: 'Subject',
      description: 'The subject line of the campaign',
      required: true,
    }),
    list_details: zohoCampaignsProps.listKeys({ required: true }),
    content_url: Property.ShortText({
      displayName: 'Content URL',
      description: 'Public URL containing the HTML content for your campaign',
      required: false,
    }),
    topicId: zohoCampaignsProps.topicId({ required: false }),
  },
  async run({ auth, propsValue }) {
    await propsValidation.validateZod(propsValue, schema);
    return await zohoCampaignsApi.createCampaign({
      auth,
      ...propsValue,
      list_details: propsValue.list_details ?? [],
    });
  },
});

const schema = {
  campaignname: z.string(),
  from_email: z.string().check(z.email()),
  subject: z.string(),
  content_url: z.optional(z.string().check(z.url())),
  list_details: z.array(z.string()),
  topicId: z.optional(z.nullable(z.string())),
};
