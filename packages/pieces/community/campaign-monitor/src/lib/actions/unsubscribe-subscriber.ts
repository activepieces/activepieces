import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';
import { campaignMonitorAuth } from '../../index';
import { clientId, listId } from '../common/props';
import { HttpStatusCode } from 'axios';

export const unsubscribeSubscriberAction = createAction({
  auth: campaignMonitorAuth,
  name: 'unsubscribe_subscriber',
  displayName: 'Unsubscribe Subscriber',
  description: 'Remove a subscriber from a list.',
  props: {
    clientId: clientId,
    listId: listId,
    email: Property.ShortText({
      displayName: 'Email Address',
      description: 'The email address of the subscriber to unsubscribe.',
      required: true,
    }),
  },
  async run({ propsValue, auth }) {
    const { listId, email } = propsValue;

    const payload = {
      EmailAddress: email,
    };

    const response = await makeRequest(
      { apiKey: auth as string },
      HttpMethod.POST,
      `/subscribers/${listId}/unsubscribe.json`,
      payload
    );

    if (response.status === HttpStatusCode.Ok) {
      return {
        success: true,
      };
    }
    return {
      success: false,
      error: response.body,
    };
  },
});
