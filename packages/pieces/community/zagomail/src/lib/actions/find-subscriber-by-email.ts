import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';
import { zagomailAuth } from '../../index';

export const findSubscriberByEmailAction = createAction({
  auth: zagomailAuth,
  name: 'find_subscriber_by_email',
  displayName: 'Find Subscriber by Email',
  description: 'Find a subscriber by their email address',
  props: {
    listId: Property.ShortText({
      displayName: 'List ID',
      description: 'The ID of the list to search in',
      required: true,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'The email address of the subscriber to find',
      required: true,
    }),
  },
  async run({ propsValue, auth }) {
    const payload = {
      email: propsValue.email,
    };

    return await makeRequest(
      auth as string,
      HttpMethod.POST,
      `/lists/search-by-email?list_uid=${propsValue.listId}`,
      payload
    );
  },
});
