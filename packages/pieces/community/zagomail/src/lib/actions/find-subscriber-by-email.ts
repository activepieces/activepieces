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
    email: Property.ShortText({
      displayName: 'Email',
      description: 'The email address of the subscriber to find',
      required: true,
    }),
    listId: Property.ShortText({
      displayName: 'List ID',
      description: 'The ID of the list to search in (leave empty to search across all lists)',
      required: false,
    }),
  },
  async run({ propsValue, auth }) {
    const endpoint = '/subscribers/search';
    const queryParams = new URLSearchParams({
      email: propsValue.email,
    });

    if (propsValue.listId) {
      queryParams.append('list_id', propsValue.listId);
    }

    return await makeRequest(
      auth as string,
      HttpMethod.GET,
      `${endpoint}?${queryParams.toString()}`,
      undefined
    );
  },
});
