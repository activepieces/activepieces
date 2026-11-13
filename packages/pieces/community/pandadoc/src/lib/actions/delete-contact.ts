import { createAction, Property } from '@activepieces/pieces-framework';
import { pandadocAuth } from '../common/auth';
import { pandadocApi } from '../common/api';
import { pandadocInputs } from '../common/inputs';
import { pandadocSchemas } from '../common/schemas';

export const deleteContact = createAction({
  auth: pandadocAuth,
  name: 'delete_contact',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Contact',
  description: 'Deletes a contact.',
  audience: 'both',
  aiMetadata: {
    description: 'Permanently delete a PandaDoc contact by contact ID. Documents already sent to the contact are not affected. Safe to retry: an already deleted contact is reported as such.',
    idempotent: true,
  },
  props: {
    contact_id: Property.ShortText({ displayName: 'Contact ID', required: true }),
  },
  outputSchema: pandadocSchemas['deleted'],
  async run({ auth, propsValue }) {
    return pandadocApi.deleteContact({
      apiKey: auth.secret_text,
      contactId: pandadocInputs.requiredString({ value: propsValue.contact_id, label: 'Contact ID' }),
    });
  },
});
