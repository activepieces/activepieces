import { createAction, Property } from '@activepieces/pieces-framework';
import { frontAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { contactDropdown } from '../common/props';

export const addContactHandle = createAction({
  auth: frontAuth,
  name: 'add_contact_handle',
  displayName: 'Add Contact Handle',
  description: 'Add a handle (email, phone number, etc.) to an existing Contact.',
  props: {
    contact_id: contactDropdown,
    handle: Property.ShortText({
      displayName: 'Handle',
      description: "The handle to add (e.g., 'john.doe@example.com', '+15551234567').",
      required: true,
    }),
    source: Property.StaticDropdown({
      displayName: 'Source',
      description: 'The type of handle being added.',
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
  async run(context) {
    const { contact_id, handle, source } = context.propsValue;
    const token = context.auth;


    await makeRequest(
        token,
        HttpMethod.POST,
        `/contacts/${contact_id}/handles`,
        {
            handle: handle,
            source: source,
        }
    );

    return { success: true };
  },
});