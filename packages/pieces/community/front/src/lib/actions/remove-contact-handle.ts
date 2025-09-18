import { createAction, Property } from '@activepieces/pieces-framework';
import { frontAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const removeContactHandle = createAction({
  auth: frontAuth,
  name: 'remove_contact_handle',
  displayName: 'Remove Contact Handle',
  description: 'Remove a handle (email, phone number, etc.) from a contact.',
  props: {
    contact_id: Property.ShortText({
      displayName: 'Contact ID or Handle',
      description:
        "The contact's unique ID (e.g., crd_123) or a resource alias (e.g., email:john.doe@example.com).",
      required: true,
    }),
    source: Property.StaticDropdown({
      displayName: 'Source',
      description: 'The type of the handle to remove.',
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
      description: 'The exact handle to remove (e.g., "john.doe@example.com").',
      required: true,
    }),
    force: Property.Checkbox({
      displayName: 'Delete Contact if Last Handle',
      description:
        'If true, the entire contact will be deleted if this is their last handle.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { contact_id, ...body } = context.propsValue;
    const token = context.auth;

    await makeRequest(
      token,
      HttpMethod.DELETE,
      `/contacts/${contact_id}/handles`,
      body
    );

    return { success: true };
  },
});
