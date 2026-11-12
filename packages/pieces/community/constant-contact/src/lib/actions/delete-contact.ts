import { createAction } from '@activepieces/pieces-framework';
import { constantContactAuth } from '../auth';
import { ccContacts } from '../common/client';
import { deleteContactOutputSchema } from '../common/output-schemas';
import { ccProps } from '../common/props';

export const deleteContact = createAction({
  auth: constantContactAuth,
  name: 'delete_contact',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Contact',
  description:
    'Deletes a contact. Constant Contact keeps deleted contacts for a while and they can be restored in the app, but they stop receiving email and are removed from lists.',
  audience: 'human',
  aiMetadata: {
    description: 'Deletes one Constant Contact contact by email or ID. A repeat fails because the contact is already deleted.',
    idempotent: false,
  },
  outputSchema: deleteContactOutputSchema,
  props: {
    contact: ccProps.contactRef({
      displayName: 'Contact Email or ID',
      description: 'The email address of the contact, or its contact ID from an earlier step.',
    }),
  },
  async run({ auth, propsValue }) {
    const contactId = await ccContacts.resolveContactId({ accessToken: auth.access_token, value: propsValue.contact, label: 'Contact Email or ID' });
    return ccContacts.deleteContact({ accessToken: auth.access_token, contactId });
  },
});
