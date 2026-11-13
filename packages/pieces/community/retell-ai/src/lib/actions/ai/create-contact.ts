import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { retellAiProps } from '../../common/ai-props';
import { retellAiAuth } from '../../common/auth';
import { apiKeyOf, retellApiCall } from '../../common/client';
import { retellInput } from '../../common/input';
import { retellMap } from '../../common/mappers';
import { retellSchemas } from '../../common/schemas';
export const createContactAction = createAction({
  auth: retellAiAuth,
  name: 'create_contact',
  classification: 'WRITE',
  displayName: 'Create Contact',
  description: 'Creates a contact for a phone number.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates a Retell contact (name, do-not-call flag, memory notes, custom fields) for a phone number. Only one contact can exist per number, so look it up with Get Contact by Phone first and use Update Contact if it exists; a second run for the same number fails.',
    idempotent: false,
  },
  props: {
    phone_number: retellAiProps.e164Number({ displayName: 'Phone Number', description: 'The contact phone number.' }),
    first_name: Property.ShortText({ displayName: 'First Name', required: false }),
    last_name: Property.ShortText({ displayName: 'Last Name', required: false }),
    do_not_call: Property.Checkbox({ displayName: 'Do Not Call', description: 'Mark the number as do-not-call.', required: false }),
    contact_memory: Property.LongText({ displayName: 'Contact Memory', description: 'Optional notes agents can read about this person.', required: false }),
    custom_fields: Property.Json({
      displayName: 'Custom Fields',
      description: 'Optional JSON object of custom field values from Retell CRM settings.',
      required: false,
    }),
  },
  outputSchema: retellSchemas.contact,
  async run({ auth, propsValue }) {
    const body: Record<string, unknown> = {
      phone_number: retellInput.e164({ value: propsValue.phone_number, label: 'Phone Number' }),
      ...contactFields(propsValue),
    };
    const contact = await retellApiCall({ apiKey: apiKeyOf(auth), method: HttpMethod.POST, path: '/create-contact', body });
    return retellMap.contact(contact);
  },
});

export function contactFields(input: {
  first_name?: unknown;
  last_name?: unknown;
  do_not_call?: unknown;
  contact_memory?: unknown;
  custom_fields?: unknown;
}): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  const firstName = retellInput.optionalText(input.first_name);
  if (firstName !== undefined) {
    body['first_name'] = firstName;
  }
  const lastName = retellInput.optionalText(input.last_name);
  if (lastName !== undefined) {
    body['last_name'] = lastName;
  }
  if (typeof input.do_not_call === 'boolean') {
    body['do_not_call'] = input.do_not_call;
  }
  const memory = retellInput.optionalText(input.contact_memory);
  if (memory !== undefined) {
    body['contact_memory'] = memory;
  }
  const customFields = retellInput.objectValue({ value: input.custom_fields, label: 'Custom Fields' });
  if (customFields !== undefined) {
    body['custom_fields'] = customFields;
  }
  return body;
}
