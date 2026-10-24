import { propsValidation } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import * as z from 'zod/mini';
import { zohoCampaignsAuth } from '../auth';
import { zohoCampaignsApi } from '../common/api';
import { zohoCampaignsProps } from '../common/props';
import type {
  ZohoCampaignsContactStatus,
  ZohoCampaignsSort,
} from '../common/types';
import { zohoCampaignsFindContactOutputSchema } from '../output-schemas';

export const findContactAction = createAction({
  auth: zohoCampaignsAuth,
  name: 'findContact',
  outputSchema: zohoCampaignsFindContactOutputSchema,
  classification: 'SEARCH',
  displayName: 'Find Contact',
  description: 'Look up an existing contact by email address.',
  audience: 'human',
  aiMetadata: {
    description:
      'Searches subscribers of a given mailing list and returns those whose email contains the supplied value (case-insensitive partial match); an empty email value effectively returns all contacts in the list, optionally filtered by subscription status and paginated. Use to resolve a contact or browse list members. Read-only and idempotent; throws if no contact matches.',
    idempotent: true,
  },
  props: {
    listkey: zohoCampaignsProps.listKey({ required: true }),
    contactEmail: Property.ShortText({
      displayName: 'Contact Email',
      description:
        'Email of the contact to be found (partial matches supported)',
      required: true,
    }),
    status: Property.StaticDropdown<ZohoCampaignsContactStatus, true>({
      displayName: 'Contact Status',
      description: 'Filter contacts by status',
      required: true,
      options: {
        options: [
          { label: 'Active', value: 'active' },
          { label: 'Recent', value: 'recent' },
          { label: 'Most Recent', value: 'most recent' },
          { label: 'Unsubscribed', value: 'unsub' },
          { label: 'Bounced', value: 'bounce' },
        ],
      },
    }),
    sort: Property.StaticDropdown<ZohoCampaignsSort, true>({
      displayName: 'Sort Order',
      description: 'Sort order for results',
      required: true,
      options: {
        options: [
          { label: 'Ascending', value: 'asc' },
          { label: 'Descending', value: 'desc' },
        ],
      },
    }),
    fromindex: Property.Number({
      displayName: 'From Index',
      description: 'Starting index for pagination (optional, default: 1)',
      required: false,
    }),
    range: Property.Number({
      displayName: 'Range',
      description: 'Number of contacts to retrieve (optional, default: all)',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    await propsValidation.validateZod(propsValue, schema);
    const {
      listkey,
      contactEmail: email,
      status,
      sort,
      fromindex,
      range,
    } = propsValue;

    const contacts = await zohoCampaignsApi.listContacts({
      auth,
      listkey,
      ...(status && { status }),
      ...(sort && { sort }),
      ...(fromindex && { fromindex }),
      ...(range && { range }),
    });
    const needle = (email ?? '').trim().toLowerCase();

    const matchingContacts = contacts.filter((contact) =>
      (contact.contact_email ?? '').toLowerCase().includes(needle)
    );

    if (matchingContacts.length === 0) {
      const statusText = status ? ` with status "${status}"` : '';
      throw new Error(
        `No contact found with an email containing "${email}"${statusText} in the selected mailing list.`
      );
    }

    return matchingContacts;
  },
});

const schema = {
  listkey: z.string(),
  contactEmail: z.string().check(z.email()),
  status: z.optional(
    z.enum(['active', 'recent', 'most recent', 'unsub', 'bounce'])
  ),
  sort: z.optional(z.enum(['asc', 'desc'])),
  fromindex: z.optional(z.number().check(z.minimum(1))),
  range: z.optional(z.number().check(z.minimum(1))),
};
