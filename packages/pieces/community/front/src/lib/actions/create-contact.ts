import { createAction, Property } from '@activepieces/pieces-framework';
import { frontAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const createContact = createAction({
  auth: frontAuth,
  name: 'create_contact',
  displayName: 'Create Contact',
  description: 'Create a new contact with name, handles, and other details.',
  props: {
    handles: Property.Array({
      displayName: 'Handles',
      description: 'List of handles for this contact (e.g., email, phone). At least one is required.',
      required: true,
      properties: {
        handle: Property.ShortText({
          displayName: 'Handle',
          description: 'The contact handle (e.g., "john.doe@example.com").',
          required: true,
        }),
        source: Property.StaticDropdown({
          displayName: 'Source',
          description: 'The type of handle.',
          required: true,
          options: {
            options: [
              { label: 'Email', value: 'email' },
              { label: 'Phone', value: 'phone' },
              { label: 'Twitter', value: 'twitter' },
              { label: 'Facebook', value: 'facebook' },
              { label: 'Intercom', value: 'intercom' },
              { label: 'Front Chat', value: 'front_chat' },
              { label: 'Custom', value: 'custom' },
            ],
          },
        }),
      },
    }),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'The name of the contact.',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'A description for the contact.',
      required: false,
    }),
    links: Property.Array({
        displayName: 'Links',
        description: 'A list of URLs associated with the contact.',
        required: false,
    }),
    list_names: Property.Array({
        displayName: 'Contact Lists',
        description: 'List of contact list names this contact belongs to. Front will create any that do not exist.',
        required: false,
    }),
    custom_fields: Property.Json({
      displayName: 'Custom Fields',
      description: 'Custom fields for this contact, as a JSON object (e.g., {"CRM ID": "12345"}).',
      required: false,
      defaultValue: {},
    }),
  },
  async run(context) {
    const token = context.auth;
    const body = { ...context.propsValue };

    // Remove empty optional properties
    Object.keys(body).forEach(key => {
        const prop = body[key as keyof typeof body];
        if (prop === undefined || (Array.isArray(prop) && prop.length === 0)) {
            delete body[key as keyof typeof body];
        }
    });

    return await makeRequest(
        token,
        HttpMethod.POST,
        '/contacts',
        body
    );
  },
});