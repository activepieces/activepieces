import { propsValidation } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import * as z from 'zod/mini';
import { zohoCampaignsAuth } from '../auth';
import { zohoCampaignsApi } from '../common/api';
import { zohoCampaignsProps } from '../common/props';
import { zohoCampaignsAddContactsToMailingListOutputSchema } from '../output-schemas';

export const addContactToMailingListAction = createAction({
  auth: zohoCampaignsAuth,
  name: 'addContactToMailingList',
  outputSchema: zohoCampaignsAddContactsToMailingListOutputSchema,
  classification: 'WRITE',
  displayName: 'Add Contact to Mailing List',
  description: 'Add contacts to your mailing lists.',
  audience: 'human',
  aiMetadata: {
    description:
      'Adds one or more contacts (by email address) to a specified mailing list. Use to subscribe known emails in bulk to a list. Idempotent: re-adding emails already on the list leaves the membership unchanged.',
    idempotent: true,
  },
  props: {
    listkey: zohoCampaignsProps.listKey({ required: true }),
    emails: Property.Array({
      displayName: 'Emails',
      description:
        'Contacts email addresses to be added to the mailing list (maximum 10 emails)',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    await propsValidation.validateZod(propsValue, schema);
    return await zohoCampaignsApi.addContactsToMailingList({
      auth,
      listkey: propsValue.listkey,
      emailids: propsValue.emails.join(','),
    });
  },
});

const schema = {
  listkey: z.string(),
  emails: z
    .array(z.string().check(z.email()))
    .check(z.minLength(1), z.maxLength(10)),
};
