import { createAction, Property } from '@activepieces/pieces-framework';
import { makeRequest } from '../common';
import { pinterestAuth } from '../common/auth';
import { HttpMethod } from '@activepieces/pieces-common';
import { pinIdDropdown } from '../common/props';

export const deletePin = createAction({
  auth: pinterestAuth,
  name: 'deletePin',
  displayName: 'Delete Pin',
  description: 'Permanently delete a specific Pin.',
  props: {
    pin_id: pinIdDropdown,
  },
  async run({ auth, propsValue }) {
    const { pin_id } = propsValue;
    return await makeRequest(
      auth.access_token as string,
      HttpMethod.DELETE,
      `/pins/${pin_id}`
    );
  },
});
