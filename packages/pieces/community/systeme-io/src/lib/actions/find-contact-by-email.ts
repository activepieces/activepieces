import { createAction, Property } from '@activepieces/pieces-framework';
import { systemeIoAuth } from '../common/auth';
import { systemeIoCommon } from '../common/client';
import { findContactByEmailActionOutputSchema } from '../output-schemas';

export const findContactByEmail = createAction({
  auth: systemeIoAuth,
  name: 'findContactByEmail',
  classification: 'READ',
  displayName: 'Find Contact by Email',
  description: 'Locate an existing contact by email address',
  audience: 'both',
  aiMetadata: { description: 'Looks up a single Systeme.io contact by exact email address (case-insensitive) using the API email filter. Use to resolve an email to a contact record (e.g. to get its id before tagging or updating). Read-only and idempotent; returns a not-found result if no contact matches.', idempotent: true },
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      description: 'The email address to search for',
      required: true,
    }),
  },
  outputSchema: findContactByEmailActionOutputSchema,
  async run(context) {
    const { email } = context.propsValue;
    const trimmed = email.trim();
    const searchEmail = trimmed.toLowerCase();
    const auth = context.auth.secret_text;
    const matches = (contact: { email?: string }) =>
      typeof contact.email === 'string' && contact.email.toLowerCase().trim() === searchEmail;

    const foundContact = (await systemeIoCommon.findContactsByEmail({ auth, email: trimmed })).find(matches);

    if (foundContact) {
      return {
        success: true,
        contact: foundContact,
        message: 'Contact found successfully',
      };
    } else {
      return {
        success: false,
        contact: null,
        message: `No contact found with email: ${email}`,
      };
    }
  },
});
