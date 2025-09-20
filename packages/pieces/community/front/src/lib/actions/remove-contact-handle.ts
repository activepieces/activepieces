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
    source: Property.ShortText({
      displayName: 'Source',
      description: 'The source of the handle (e.g., email, phone).',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { contact_id, handle, source } = propsValue;
    const body: Record<string, unknown> = { handle, source };
    const path = `/contacts/${contact_id}/handles`;
    return await makeRequest(auth.access_token, HttpMethod.DELETE, path, body);
  },
});
