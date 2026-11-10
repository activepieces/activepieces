import { createAction } from '@activepieces/pieces-framework';
import { apolloAuth } from '../../auth';
import { apiKeyOf } from '../../common/client';
import { aiProps, apolloInputs } from '../../common/ai-props';
import { apolloOutputSchemas } from '../../common/output-schemas';
import { apolloMappers, apolloRequests } from '../../common/requests';

export const aiFindContactByEmailAction = createAction({
  auth: apolloAuth,
  name: 'ai_find_contact_by_email',
  classification: 'READ',
  displayName: 'Find Contact by Email',
  description: 'Find a saved contact by exact email.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Finds the contact saved in your Apollo CRM whose email exactly matches (case-insensitive) and returns found=false when none does; other_contact_ids lists further duplicates. Use before Create Contact to avoid duplicates. Uses no credits; needs a paid Apollo plan.',
    idempotent: true,
  },
  props: {
    email: aiProps.text({ displayName: 'Email', description: 'Exact email address.', required: true }),
  },
  outputSchema: apolloOutputSchemas.contactFound,
  async run({ propsValue, auth }) {
    const email = apolloInputs.requireText({ value: propsValue.email, label: 'Email' });
    const result = await apolloRequests.findContactByEmail({ apiKey: apiKeyOf(auth), email });
    return { found: result.contact !== null, contact: result.contact === null ? null : apolloMappers.contact(result.contact), other_contact_ids: result.otherContactIds };
  },
});
