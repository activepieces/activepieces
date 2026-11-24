import { createAction, Property } from '@activepieces/pieces-framework';
import { pandadocAuth } from '../common/auth';
import { pandadocApi } from '../common/api';
import { pandadocInputs } from '../common/inputs';
import { pandadocSchemas } from '../common/schemas';

export const findContacts = createAction({
  auth: pandadocAuth,
  name: 'find_contacts',
  classification: 'SEARCH',
  displayName: 'Find Contacts',
  description: 'Finds contacts by exact email, or lists all contacts.',
  audience: 'both',
  aiMetadata: {
    description: 'Find PandaDoc contacts by exact email address, or list all contacts when Email is empty. Use it before Create Contact to avoid duplicates and to get contact IDs. Read-only.',
    idempotent: true,
  },
  props: {
    email: Property.ShortText({ displayName: 'Email', description: 'Exact email to match. Leave empty to list all contacts.', required: false }),
  },
  outputSchema: pandadocSchemas['contactList'],
  async run({ auth, propsValue }) {
    return pandadocApi.listContacts({ apiKey: auth.secret_text, email: pandadocInputs.optionalString(propsValue.email) });
  },
});
