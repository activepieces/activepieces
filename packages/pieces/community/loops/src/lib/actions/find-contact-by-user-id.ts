import { createAction, Property } from '@activepieces/pieces-framework';
import { loopsAuth } from '../auth';
import { loopsClient } from '../common/client';
import { loopsSchemas } from '../common/schemas';

export const findContactByUserId = createAction({
  name: 'find_contact_by_user_id',
  classification: 'SEARCH',
  displayName: 'Find Contact by User ID',
  description: 'Looks up a Loops contact by your internal user ID.',
  audience: 'ai',
  outputSchema: loopsSchemas.singleContact,
  aiMetadata: {
    description:
      'Looks up one Loops contact by the internal user ID your system stored on it (not the Loops contact ID). Returns found=false and contact=null when no contact has that user ID. Returns the contact ID, email, names, subscription status, user group, source, mailing-list memberships and custom properties. Read-only.',
    idempotent: true,
  },
  auth: loopsAuth,
  props: {
    userId: Property.ShortText({
      displayName: 'User ID',
      description: 'Your internal user ID stored on the contact.',
      required: true,
    }),
  },
  async run(context) {
    const contacts = await loopsClient.findContacts({
      apiKey: context.auth.secret_text,
      queryParams: loopsClient.requireOneIdentifier({
        identifyBy: 'userId',
        value: context.propsValue.userId,
      }),
    });
    const contact = contacts.length > 0 ? contacts[0] : null;
    return { found: contact !== null, contact };
  },
});
