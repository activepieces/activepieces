import { createAction, Property } from '@activepieces/pieces-framework';
import { frontAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { contactIdDropdown } from '../common/dropdown';

export const addContactHandle = createAction({
  auth: frontAuth,
  name: 'addContactHandle',
  displayName: 'Add Contact Handle',
  description:
    'Add a handle (email, phone number, etc.) to an existing Contact.',
  props: {
    contact_id: contactIdDropdown,
    handle_type: Property.StaticDropdown({
      displayName: 'Handle Type',
      description: 'Type of handle to add.',
      required: true,
      options: {
        options: [
          { label: 'Email', value: 'email' },
          { label: 'Phone', value: 'phone' },
          { label: 'Twitter', value: 'twitter' },
          { label: 'Facebook', value: 'facebook' },
          { label: 'Intercom', value: 'intercom' },
          { label: 'front_chat', value: 'front_chat' },
          { label: 'custom', value: 'custom' },
        ],
      },
    }),
    handle_value: Property.ShortText({
      displayName: 'Handle Value',
      description:
        'The value of the handle (e.g., email address, phone number).',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { contact_id, handle_type, handle_value } = propsValue;
    const path = `/contacts/${contact_id}/handles`;
    const body = {
      source: handle_type,
      handle: handle_value,
    };

    await makeRequest(auth, HttpMethod.POST, path, body);
    return {
      success: true,
      message: `Handle added successfully to ${contact_id}`,
    };
  },
});
