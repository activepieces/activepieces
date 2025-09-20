import { createAction, Property } from '@activepieces/pieces-framework';
import { frontAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const createContact = createAction({
  auth: frontAuth,
  name: 'create_contact',
  displayName: 'Create Contact',
  description:
    'Create a new contact (name, email addresses, phone numbers, links, etc.).',
  props: {
    handles: Property.Array({
      displayName: 'Handles',
      description:
        'List of handles for the contact (e.g., email, phone). At least one is required.',
      required: true,
      properties: {
        handle: Property.ShortText({
          displayName: 'Handle',
          description: 'The contact info (e.g., "john.doe@example.com").',
          required: true,
        }),
        source: Property.StaticDropdown({
          displayName: 'Source',
          description: 'The type of the handle.',
          required: true,
          options: {
            options: [
              { label: 'Email', value: 'email' },
              { label: 'Phone', value: 'phone' },
              { label: 'Twitter', value: 'twitter' },
              { label: 'Facebook', value: 'facebook' },
            ],
          },
        }),
      },
    }),
    name: Property.ShortText({
      displayName: 'Name',
      description: "The contact's full name.",
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'An optional description for the contact.',
      required: false,
    }),
    list_names: Property.Array({
      displayName: 'Contact Lists',
      description: 'List of contact list names to add this contact to.',
      required: false,
    }),
    custom_fields: Property.Json({
      displayName: 'Custom Fields',
      description:
        'Custom fields as a JSON object. Example: {"company_size": 100}',
      required: false,
    }),
  },
  async run(context) {
    const { ...body } = context.propsValue;
    const token = context.auth;

    return await makeRequest(token, HttpMethod.POST, '/contacts', body);
  },
});
