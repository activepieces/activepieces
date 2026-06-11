import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';
import { campaignMonitorAuth } from '../auth';
import { clientId, listId } from '../common/props';
import { HttpStatusCode } from 'axios';

export const unsubscribeSubscriberAction = createAction({
  auth: campaignMonitorAuth,
  name: 'unsubscribe_subscriber',
  displayName: 'Unsubscribe Subscriber',
  description: 'Remove a subscriber from a list.',
  audience: 'both',
  aiMetadata: {
    description:
      'Unsubscribes a subscriber, identified by email, from a specific Campaign Monitor list under a client, marking them as opted out. Choose this to suppress a contact from further sends on that list. Idempotent: repeating the call leaves the subscriber in the same unsubscribed state.',
    idempotent: true,
  },
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
        { apiKey: auth.secret_text },
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
