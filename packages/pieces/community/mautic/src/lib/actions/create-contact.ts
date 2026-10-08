import { createAction } from '@activepieces/pieces-framework';
import { mauticAuth } from '../auth';
import { mauticApi } from '../common/api';
import { mauticProps } from '../common/props';

export const createContactAction = createAction({
  auth: mauticAuth,
  description: 'Creates a new contact in Mautic CRM',
  audience: 'both',
  aiMetadata: {
    description:
      'Create a new contact (lead) in Mautic from the provided field values (name, email, phone, custom fields, etc.). Use when adding a person to Mautic; to modify an existing contact use Update Contact instead, and to avoid duplicates check first with Search Contact. Not idempotent: each call inserts a new contact, so repeating it produces duplicates.',
    idempotent: false,
  },
  displayName: 'Create Contact',
  name: 'create_mautic_contact',
  classification: 'WRITE',
  props: {
    fields: mauticProps.contactFields({ required: true }),
  },
  run: async function (context) {
    return await mauticApi.createContact({ auth: context.auth, fields: context.propsValue.fields });
  },
});
