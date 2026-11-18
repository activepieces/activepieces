import { createAction, Property } from '@activepieces/pieces-framework';
import { reviewflowzAuth } from '../auth';
import { reviewflowzContacts } from '../common/contacts';
import { reviewflowzSearch } from '../common/search';

export const findContactAction = createAction({
  auth: reviewflowzAuth,
  name: 'find_contact',
  classification: 'SEARCH',
  displayName: 'Find Contact',
  description: 'Finds a customer by email or phone number, and can save them when they are new.',
  audience: 'both',
  aiMetadata: {
    description:
      'Find a Reviewflowz contact by email or phone. Returns found: false when there is none, unless "Create if not found" is on, which saves them (nothing is sent). Safe to retry.',
    idempotent: true,
  },
  props: {
    email: Property.ShortText({ displayName: 'Email', required: false }),
    phone: Property.ShortText({
      displayName: 'Phone number',
      description: 'International format, like +14155550100.',
      required: false,
    }),
    create_if_missing: Property.Checkbox({
      displayName: 'Create if not found',
      description: 'On saves the customer when we do not know them yet.',
      required: false,
      defaultValue: false,
    }),
    first_name: Property.ShortText({ displayName: 'First name (when created)', required: false }),
    last_name: Property.ShortText({ displayName: 'Last name (when created)', required: false }),
  },
  async run(context) {
    const { auth, propsValue: input } = context;
    if (!input.email && !input.phone) {
      throw new Error('Search by email or phone number.');
    }
    const rows = await reviewflowzSearch.list({
      auth,
      path: '/contacts',
      query: { ...(input.email ? { email: input.email } : { phone: input.phone }), limit: 1 },
    });
    if (rows.length > 0 || !input.create_if_missing) {
      return reviewflowzSearch.first(rows);
    }
    const created = await reviewflowzContacts.upsertContact({
      auth,
      contact: { email: input.email, phone: input.phone, first_name: input.first_name, last_name: input.last_name },
    });
    return { found: false, created: true, ...created };
  },
});
