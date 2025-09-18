import { createAction, Property } from '@activepieces/pieces-framework';
import { frontAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const addContactHandle = createAction({
  auth: frontAuth,
  name: 'add_contact_handle',
  displayName: 'Add Contact Handle',
  description:
    'Add a handle (email, phone number, etc.) to an existing contact.',
  props: {
    contact_id: Property.ShortText({
      displayName: 'Contact ID or Handle',
      description:
        "The contact's unique ID (e.g., crd_123) or a resource alias (e.g., email:john.doe@example.com).",
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
          { label: 'Intercom', value: 'intercom' },
          { label: 'Front Chat', value: 'front_chat' },
          { label: 'Custom', value: 'custom' },
        ],
      },
    }),
    handle: Property.ShortText({
      displayName: 'Handle',
      description:
        'The contact information (e.g., a new email address or phone number).',
      required: true,
    }),
  },
  async run(context) {
    const { contact_id, source, handle } = context.propsValue;
    const token = context.auth;
    const body = { source, handle };

    await makeRequest(
      token,
      HttpMethod.POST,
      `/contacts/${contact_id}/handles`,
      body
    );

    return { success: true };
  },
});
