import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';
import { zagomailAuth } from '../../index';

export const getSubscriberDetailsAction = createAction({
  auth: zagomailAuth,
  name: 'get_subscriber_details',
  displayName: 'Get Subscriber Details',
  description: 'Get detailed information about a subscriber',
  props: {
    listId: Property.ShortText({
      displayName: 'List ID',
      description: 'The ID of the list the subscriber belongs to',
      required: true,
    }),
    subscriberId: Property.ShortText({
      displayName: 'Subscriber ID',
      description: 'The ID of the subscriber to get details for',
      required: true,
    }),
  },
  async run({ propsValue, auth }) {
    return await makeRequest(
      auth as string,
      HttpMethod.GET,
      `/lists/get-subscriber?list_uid=${propsValue.listId}&subscriber_uid=${propsValue.subscriberId}`,
      undefined
    );
  },
});
