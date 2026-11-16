import { createAction, Property } from '@activepieces/pieces-framework';
import { loopsAuth } from '../auth';
import { loopsClient } from '../common/client';
import { loopsSchemas } from '../common/schemas';

export const findContactByEmail = createAction({
  name: 'find_contact_by_email',
  classification: 'SEARCH',
  displayName: 'Find Contact by Email',
  description: 'Looks up a Loops contact by email address.',
  audience: 'ai',
  outputSchema: loopsSchemas.singleContact,
  aiMetadata: {
    description:
      'Looks up one Loops contact by exact email address. Returns found=false and contact=null when no contact has that email. Returns the contact ID, names, user ID, subscription status, user group, source, mailing-list memberships and custom properties. Read-only.',
    idempotent: true,
  },
  auth: loopsAuth,
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      description: 'The exact email address of the contact.',
      required: true,
    }),
  },
  async run(context) {
    const contacts = await loopsClient.findContacts({
      apiKey: context.auth.secret_text,
      queryParams: loopsClient.requireOneIdentifier({
        identifyBy: 'email',
        value: context.propsValue.email,
      }),
    });
    const contact = contacts.length > 0 ? contacts[0] : null;
    return { found: contact !== null, contact };
  },
});
