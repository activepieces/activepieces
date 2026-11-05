import { propsValidation } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import * as z from 'zod/mini';
import { zohoCampaignsAuth } from '../auth';
import { zohoCampaignsApi } from '../common/api';
import { zohoCampaignsProps } from '../common/props';
import { zohoCampaignsCloneCampaignOutputSchema } from '../output-schemas';

export const cloneCampaignAction = createAction({
  auth: zohoCampaignsAuth,
  name: 'cloneCampaign',
  outputSchema: zohoCampaignsCloneCampaignOutputSchema,
  classification: 'WRITE',
  displayName: 'Clone Campaign',
  description: 'Clone an existing campaign, optionally renaming.',
  audience: 'human',
  aiMetadata: {
    description:
      'Duplicates an existing Zoho Campaigns campaign (identified by its campaign key) into a new draft, optionally overriding name, subject, sender name/address, reply-to, and encoding. Use to reuse a prior campaign as a starting point. Not idempotent: each call produces a new campaign.',
    idempotent: false,
  },
  props: {
    campaignkey: zohoCampaignsProps.campaignKey({ required: true }),
    campaignname: Property.ShortText({
      displayName: 'Campaign Name',
      description: 'New name for the cloned campaign',
      required: false,
    }),
    subject: Property.ShortText({
      displayName: 'Subject',
      description: 'New subject line for the cloned campaign',
      required: false,
    }),
    from_name: Property.ShortText({
      displayName: 'From Name',
      description: 'Sender name for the cloned campaign',
      required: false,
    }),
    from_add: Property.ShortText({
      displayName: 'From Email',
      description: 'Sender email address for the cloned campaign',
      required: false,
    }),
    reply_to: Property.ShortText({
      displayName: 'Reply-To Email',
      description: 'Reply-to email address for the cloned campaign',
      required: false,
    }),
    encode_type: Property.ShortText({
      displayName: 'Encoding Type',
      description: 'Email encoding type (e.g., UTF-8)',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    await propsValidation.validateZod(propsValue, schema);
    return await zohoCampaignsApi.cloneCampaign({ auth, ...propsValue });
  },
});

const schema = {
  campaignkey: z.string(),
  campaignname: z.optional(z.string()),
  subject: z.optional(z.string()),
  from_name: z.optional(z.string()),
  from_add: z.optional(z.string().check(z.email())),
  reply_to: z.optional(z.string().check(z.email())),
  encode_type: z.optional(z.string()),
};
