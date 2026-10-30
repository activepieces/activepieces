import { createAction, Property } from '@activepieces/pieces-framework';
import { pandadocAuth } from '../../common/auth';
import { pandadocApi } from '../../common/api';
import { pandadocInputs } from '../../common/inputs';
import { pandadocNormalize } from '../../common/normalize';
import { pandadocSchemas } from '../../common/schemas';
import { contactProps, contactBody } from './contact-props';

export const updateContactAi = createAction({
  auth: pandadocAuth,
  name: 'update_contact',
  classification: 'WRITE',
  displayName: 'Update Contact (AI)',
  description: 'Updates an existing PandaDoc contact by ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Change fields of an existing PandaDoc contact by contact ID (get it from Find Contacts). Only the fields you pass are changed; empty values are ignored. Idempotent: repeating the same update gives the same result.',
    idempotent: true,
  },
  props: {
    contact_id: Property.ShortText({ displayName: 'Contact ID', required: true }),
    email: Property.ShortText({ displayName: 'Email', required: false }),
    ...contactProps,
  },
  outputSchema: pandadocSchemas['contact'],
  async run({ auth, propsValue }) {
    const email = pandadocInputs.optionalString(propsValue.email);
    const body = { ...(email === undefined ? {} : { email }), ...contactBody(propsValue) };
    if (Object.keys(body).length === 0) {
      throw new Error('Pass at least one field to update.');
    }
    const raw = await pandadocApi.updateContactRaw({
      apiKey: auth.secret_text,
      contactId: pandadocInputs.requiredString({ value: propsValue.contact_id, label: 'Contact ID' }),
      body,
    });
    return pandadocNormalize.contact(raw);
  },
});
