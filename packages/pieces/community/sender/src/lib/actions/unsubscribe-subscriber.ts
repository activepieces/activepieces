import { createAction, Property } from '@activepieces/pieces-framework';
import {
  makeSenderRequest,
  senderAuth,
  subscriberDropdownSingle,
} from '../common/common';
import { HttpMethod } from '@activepieces/pieces-common';
import { subscribe } from 'diagnostics_channel';

export const unsubscribeSubscriberAction = createAction({
  auth: senderAuth,
  name: 'unsubscribe_subscriber',
  displayName: 'Unsubscribe Subscriber',
  description: 'Mark an email address as unsubscribed globally or from a group',
  props: {
    subscriber: subscriberDropdownSingle,
  },
  async run(context) {
    const subscriber = context.propsValue.subscriber;
    const subscriberId = subscriber;

    const requestBody = {
      subscribers: [subscriberId],
    };

    const response = await makeSenderRequest(
      context.auth,
      `/subscribers`,
      HttpMethod.DELETE,
      requestBody
    );
    return response.body;
  },
});
