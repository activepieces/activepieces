import { createAction } from '@activepieces/pieces-framework';
import { constantContactAuth } from '../../auth';
import { ccContacts } from '../../common/client';
import { aiProps } from '../../common/ai-props';
import { deleteContactOutputSchema } from '../../common/output-schemas';

export const deleteContactAiAction = createAction({
  auth: constantContactAuth,
  name: 'delete_contact_ai',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Contact',
  description: 'Deletes one contact.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Deletes one Constant Contact contact by contact_id or email; it stops receiving email and leaves all lists. To only stop email, use Unsubscribe Contact. A repeat by email fails because deleted contacts are not matched.',
    idempotent: false,
  },
  outputSchema: deleteContactOutputSchema,
  props: {
    contact_id_or_email: aiProps.contactIdOrEmail(),
  },
  async run({ auth, propsValue }) {
    const contactId = await ccContacts.resolveContactId({ accessToken: auth.access_token, value: propsValue.contact_id_or_email, label: 'Contact ID or Email' });
    return ccContacts.deleteContact({ accessToken: auth.access_token, contactId });
  },
});
