import { createAction, Property } from '@activepieces/pieces-framework';
import { frontAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { contactIdDropdown } from '../common/dropdown';

export const removeContactHandle = createAction({
  auth: frontAuth,
  name: 'removeContactHandle',
  displayName: 'Remove Contact Handle',
  description:
    'Remove a handle (email, phone number, etc.) from an existing Contact.',
  props: {
    contact_id: contactIdDropdown,
    handle: Property.ShortText({
      displayName: 'Handle ID',
      description: 'The ID of the handle to remove.',
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
    force: Property.Checkbox({
      displayName: 'Delete Contact if Last Handle',
      description:
        'If true, the entire contact will be deleted if this is their last handle.',
      required: false,
      defaultValue: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { contact_id, handle, source, force } = propsValue;
    const body: Record<string, unknown> = { handle, source, force };
    const path = `/contacts/${contact_id}/handles`;
    return await makeRequest(auth.access_token, HttpMethod.DELETE, path, body);
  },
});
