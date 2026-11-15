import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { loopsAuth } from '../auth';
import { loopsClient } from '../common/client';
import { loopsSchemas } from '../common/schemas';

export const createContactProperty = createAction({
  name: 'create_contact_property',
  classification: 'WRITE',
  displayName: 'Create Contact Property',
  description: 'Creates a custom contact property in Loops.',
  audience: 'both',
  outputSchema: loopsSchemas.success,
  aiMetadata: {
    description:
      'Creates a custom contact property in Loops with a camelCase name and a type of string, number, boolean or date. Check list_contact_properties first: creating a name that already exists fails. Not idempotent.',
    idempotent: false,
  },
  auth: loopsAuth,
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      description: 'The property key in camelCase (e.g. "planName").',
      required: true,
    }),
    type: Property.StaticDropdown({
      displayName: 'Type',
      description: 'The data type of the property.',
      required: true,
      defaultValue: 'string',
      options: {
        disabled: false,
        options: [
          { label: 'Text', value: 'string' },
          { label: 'Number', value: 'number' },
          { label: 'Boolean', value: 'boolean' },
          { label: 'Date', value: 'date' },
        ],
      },
    }),
  },
  async run(context) {
    const { name, type } = context.propsValue;
    return loopsClient.request<Record<string, unknown>>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      path: '/contacts/properties',
      body: { name: name.trim(), type },
    });
  },
});
