import { propsValidation } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import * as z from 'zod/mini';
import { zohoCampaignsAuth } from '../auth';
import { zohoCampaignsApi } from '../common/api';
import { zohoCampaignsProps } from '../common/props';
import { zohoCampaignsStatusOutputSchema } from '../output-schemas';

export const addTagToContactAction = createAction({
  auth: zohoCampaignsAuth,
  name: 'addTagToContact',
  outputSchema: zohoCampaignsStatusOutputSchema,
  classification: 'WRITE',
  displayName: 'Add Tag to Contact',
  description:
    "Apply a tag to a contact by email. Creates the tag if it doesn't exist.",
  audience: 'human',
  aiMetadata: {
    description:
      'Applies a tag to a contact identified by email address, first creating the tag in the account if it does not already exist. Use to label or segment a subscriber. Idempotent: re-applying the same tag to the same contact leaves the contact in the same tagged state.',
    idempotent: true,
  },
  props: {
    tagName: zohoCampaignsProps.tagName({ required: true }),
    lead_email: Property.ShortText({
      displayName: 'Contact Email',
      description: 'Email address of the contact to tag',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    await propsValidation.validateZod(propsValue, schema);
    await zohoCampaignsApi.ensureTag({ auth, tagName: propsValue.tagName });
    return await zohoCampaignsApi.addTagToContact({ auth, ...propsValue });
  },
});

const schema = {
  tagName: z.string(),
  lead_email: z.string().check(z.email()),
};
