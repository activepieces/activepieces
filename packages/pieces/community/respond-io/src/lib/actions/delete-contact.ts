import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { respondIoApiCall } from '../common/client';
import { respondIoAuth } from '../common/auth';
import { contactIdentifierDropdown } from '../common/props';

export const deleteContact = createAction({
  auth: respondIoAuth,
  name: 'delete_contact',
  displayName: 'Delete Contact',
  description: 'Permanently delete a contact from Respond.io.',
  props: {
    identifier: contactIdentifierDropdown,
  },
  async run({ propsValue, auth }) {
    const { identifier } = propsValue;

    return await respondIoApiCall({
      method: HttpMethod.DELETE,
      url: `/contact/${identifier}`,
      auth: auth,
    });
  },
});
