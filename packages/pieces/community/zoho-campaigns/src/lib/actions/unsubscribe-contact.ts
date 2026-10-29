import { propsValidation } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import * as z from 'zod/mini';
import { zohoCampaignsAuth } from '../auth';
import { zohoCampaignsApi } from '../common/api';
import { zohoCampaignsProps } from '../common/props';
import { zohoCampaignsStatusOutputSchema } from '../output-schemas';

export const unsubscribeContactAction = createAction({
  auth: zohoCampaignsAuth,
  name: 'unsubscribeContact',
  outputSchema: zohoCampaignsStatusOutputSchema,
  classification: 'DESTRUCTIVE',
  displayName: 'Unsubscribe Contact',
  description: 'Remove a contact from a mailing list.',
  audience: 'human',
  aiMetadata: {
    description:
      'Unsubscribes a contact (matched by email) from a specified mailing list, optionally scoped to a particular topic. Use to opt a subscriber out of a list or topic. Idempotent: an already-unsubscribed contact stays unsubscribed on repeat calls.',
    idempotent: true,
  },
  props: {
    listkey: zohoCampaignsProps.listKey({ required: true }),
    contactinfo: zohoCampaignsProps.contactInfo({ required: true }),
    topic_id: zohoCampaignsProps.topicId({ required: false }),
  },
  async run({ auth, propsValue }) {
    await propsValidation.validateZod(propsValue, schema);
    const { additionalFields, ...baseFields } = propsValue.contactinfo;
    return await zohoCampaignsApi.unsubscribeContact({
      auth,
      listkey: propsValue.listkey,
      contactinfo: {
        ...baseFields,
        ...additionalFields,
      },
      topic_id: propsValue.topic_id,
    });
  },
});

const schema = {
  listkey: z.string(),
  contactinfo: z.object({
    'Contact Email': z.string().check(z.email()),
  }),
  topic_id: z.optional(z.nullable(z.string())),
};
