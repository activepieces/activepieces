import { createAction, Property } from '@activepieces/pieces-framework';
import { pandadocAuth } from '../../common/auth';
import { pandadocApi } from '../../common/api';
import { pandadocInputs } from '../../common/inputs';
import { pandadocNormalize } from '../../common/normalize';
import { pandadocSchemas } from '../../common/schemas';
import { contactProps, contactBody } from './contact-props';

export const createContactAi = createAction({
  auth: pandadocAuth,
  name: 'create_contact',
  classification: 'WRITE',
  displayName: 'Create Contact (AI)',
  description: 'Creates a new PandaDoc contact.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Create a new contact in the PandaDoc address book. Check Find Contacts by email first: this always creates a new record and is not idempotent. To change an existing contact use Update Contact.',
    idempotent: false,
  },
  props: {
    email: Property.ShortText({ displayName: 'Email', required: true }),
    ...contactProps,
  },
  outputSchema: pandadocSchemas['contact'],
  async run({ auth, propsValue }) {
    const body = { email: pandadocInputs.requiredString({ value: propsValue.email, label: 'Email' }), ...contactBody(propsValue) };
    return pandadocNormalize.contact(await pandadocApi.createContactRaw({ apiKey: auth.secret_text, body }));
  },
});
