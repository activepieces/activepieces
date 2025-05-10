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
      `/subscribers/${propsValue.subscriberId}`,
      undefined
    );
  },
});
