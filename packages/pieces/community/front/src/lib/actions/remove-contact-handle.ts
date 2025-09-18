import { createAction, Property } from '@activepieces/pieces-framework';

import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { frontAuth } from '../common/auth';

export const removeContactHandle = createAction({
  auth: frontAuth,
  name: 'removeContactHandle',
  displayName: 'Remove Contact Handle',
  description: 'Remove a handle (email, phone number, etc.) from an existing Contact.',
  props: {
    contact_id: Property.ShortText({
      displayName: 'Contact ID',
      description: 'The ID of the contact.',
      required: true,
    }),
    handle_id: Property.ShortText({
      displayName: 'Handle ID',
      description: 'The ID of the handle to remove.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { contact_id, handle_id } = propsValue;
    const path = `/contacts/${contact_id}/handles/${handle_id}`;
    return await makeRequest(auth.access_token, HttpMethod.DELETE, path);
  },
});