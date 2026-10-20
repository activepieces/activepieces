import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { retellAiProps } from '../../common/ai-props';
import { retellAiAuth } from '../../common/auth';
import { apiKeyOf, retellApiCall } from '../../common/client';
import { retellInput } from '../../common/input';
import { retellMap } from '../../common/mappers';
import { retellSchemas } from '../../common/schemas';
import { contactFields } from './create-contact';

export const updateContactAction = createAction({
  auth: retellAiAuth,
  name: 'update_contact',
  classification: 'WRITE',
  displayName: 'Update Contact',
  description: 'Changes fields of an existing contact.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Changes name, do-not-call flag, memory notes or custom fields of one Retell contact; only fields you set are sent and Contact Memory replaces the old notes. Safe to retry with the same values.',
    idempotent: true,
  },
  props: {
    contact_id: retellAiProps.id({ displayName: 'Contact ID', description: 'Use Get Contact by Phone or List Contacts to find it.' }),
    first_name: Property.ShortText({ displayName: 'First Name', required: false }),
    last_name: Property.ShortText({ displayName: 'Last Name', required: false }),
    do_not_call: Property.StaticDropdown({
      displayName: 'Do Not Call',
      description: 'Optional: set or clear the do-not-call flag.',
      required: false,
      options: { options: [{ label: 'Yes', value: 'true' }, { label: 'No', value: 'false' }] },
    }),
    contact_memory: Property.LongText({ displayName: 'Contact Memory', description: 'Optional notes; replaces the old notes.', required: false }),
    custom_fields: Property.Json({ displayName: 'Custom Fields', description: 'Optional JSON object of custom field values; null clears a field.', required: false }),
  },
  outputSchema: retellSchemas.contact,
  async run({ auth, propsValue }) {
    const doNotCall = propsValue.do_not_call === 'true' ? true : propsValue.do_not_call === 'false' ? false : undefined;
    const body = contactFields({ ...propsValue, do_not_call: doNotCall });
    if (Object.keys(body).length === 0) {
      throw new Error('Set at least one field to update.');
    }
    const contact = await retellApiCall({
      apiKey: apiKeyOf(auth),
      method: HttpMethod.PATCH,
      path: `/update-contact/${retellInput.seg({ value: propsValue.contact_id, label: 'Contact ID' })}`,
      body,
      retryRateLimit: true,
    });
    return retellMap.contact(contact);
  },
});
