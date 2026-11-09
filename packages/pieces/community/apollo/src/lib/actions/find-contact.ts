import { Property, createAction } from '@activepieces/pieces-framework';
import { apolloAuth } from '../auth';
import { apiKeyOf } from '../common/client';
import { apolloInputs } from '../common/ai-props';
import { apolloOutputSchemas } from '../common/output-schemas';
import { apolloMappers, apolloRequests } from '../common/requests';

export const findContactAction = createAction({
  auth: apolloAuth,
  name: 'find_contact',
  classification: 'READ',
  displayName: 'Find Contact',
  description: 'Find a saved Apollo contact by exact email address. Needs a paid Apollo plan.',
  audience: 'human',
  aiMetadata: {
    description:
      'Finds the saved Apollo contact whose email exactly matches (case-insensitive) and returns found=false when none does. Uses no credits; needs a paid plan for contact search.',
    idempotent: true,
  },
  props: {
    email: Property.ShortText({ displayName: 'Email', description: 'Exact email address of the contact.', required: true }),
  },
  outputSchema: apolloOutputSchemas.contactFound,
  async run({ propsValue, auth }) {
    const email = apolloInputs.requireText({ value: propsValue.email, label: 'Email' });
    const result = await apolloRequests.findContactByEmail({ apiKey: apiKeyOf(auth), email });
    return { found: result.contact !== null, contact: result.contact === null ? null : apolloMappers.contact(result.contact), other_contact_ids: result.otherContactIds };
  },
});
