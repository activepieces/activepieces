import { propsValidation } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import * as z from 'zod/mini';
import { zohoCampaignsAuth } from '../auth';
import { zohoCampaignsApi } from '../common/api';
import { zohoCampaignsProps } from '../common/props';
import { zohoCampaignsStatusOutputSchema } from '../output-schemas';

export const removeTagAction = createAction({
  auth: zohoCampaignsAuth,
  name: 'removeTag',
  outputSchema: zohoCampaignsStatusOutputSchema,
  classification: 'WRITE',
  displayName: 'Remove Tag',
  description: 'Remove a tag from a contact.',
  audience: 'human',
  aiMetadata: {
    description:
      'Removes a tag from a contact. Use to unlabel or de-segment a subscriber. Idempotent: once the tag is gone, repeating the call leaves the contact in the same untagged state.',
    idempotent: true,
  },
  props: {
    tagName: zohoCampaignsProps.tagName({ required: true }),
    lead_email: Property.ShortText({
      displayName: 'Contact Email',
      description: 'Email address of the contact to remove the tag from',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    await propsValidation.validateZod(propsValue, schema);
    return await zohoCampaignsApi.removeTag({ auth, ...propsValue });
  },
});

const schema = {
  tagName: z.string(),
  lead_email: z.string().check(z.email()),
};
