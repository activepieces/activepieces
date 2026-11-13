import { propsValidation } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import * as z from 'zod/mini';
import { zohoCampaignsAuth } from '../auth';
import { zohoCampaignsApi } from '../common/api';
import { zohoCampaignsProps } from '../common/props';
import { zohoCampaignsStatusOutputSchema } from '../output-schemas';

export const addUpdateContactAction = createAction({
  auth: zohoCampaignsAuth,
  name: 'addUpdateContact',
  outputSchema: zohoCampaignsStatusOutputSchema,
  classification: 'WRITE',
  displayName: 'Add/Update Contact',
  description:
    'Add a new contact or update an existing one. Confirmation email sent based on mailing list settings.',
  audience: 'human',
  aiMetadata: {
    description:
      'Adds a contact to a mailing list or updates the existing contact matched by email, setting standard and custom fields. Use to create or keep a subscriber record current. Effectively an upsert keyed on email, so repeating with the same input converges to the same state and is idempotent; note a confirmation email may be sent depending on the list settings.',
    idempotent: true,
  },
  props: {
    listkey: zohoCampaignsProps.listKey({ required: true }),
    contactinfo: zohoCampaignsProps.contactInfo({ required: true }),
    source: Property.ShortText({
      displayName: 'Source',
      description: 'Contact source can be added.',
      required: false,
    }),
    topic_id: zohoCampaignsProps.topicId({ required: false }),
  },
  async run({ auth, propsValue }) {
    await propsValidation.validateZod(propsValue, schema);
    const { additionalFields, ...baseFields } = propsValue.contactinfo;
    return await zohoCampaignsApi.addUpdateContact({
      auth,
      listkey: propsValue.listkey,
      contactinfo: {
        ...baseFields,
        ...additionalFields,
      },
      source: propsValue.source,
      topic_id: propsValue.topic_id,
    });
  },
});

const schema = {
  listkey: z.string(),
  contactinfo: z.object({
    'Contact Email': z.string().check(z.email()),
  }),
  source: z.optional(z.string()),
  topic_id: z.optional(z.nullable(z.string())),
};
