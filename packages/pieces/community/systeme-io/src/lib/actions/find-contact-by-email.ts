import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { systemeIoAuth } from '../common/auth';
import { systemeIoCommon } from '../common/client';

export const findContactByEmail = createAction({
  auth: systemeIoAuth,
  name: 'findContactByEmail',
  displayName: 'Find Contact by Email',
  description: 'Find a contact by their email address',
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      description: 'The email address to search for',
      required: true,
    }),
  },
  async run(context) {
    const { email } = context.propsValue;
    
    const response = await systemeIoCommon.apiCall({
      method: HttpMethod.GET,
      url: `/contacts?email=${encodeURIComponent(email)}`,
      auth: context.auth,
    });

    return response;
  },
});
