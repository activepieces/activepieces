import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest, transformCustomFields } from '../common/client';
import { campaignMonitorAuth } from '../../index';
import { clientId, listId } from '../common/props';

export const findSubscriberAction = createAction({
  auth: campaignMonitorAuth,
  name: 'find_subscriber',
  displayName: 'Find Subscriber',
  description: 'Find a subscriber by email in a specific list.',
  props: {
    clientId: clientId,
    listId: listId,
    email: Property.ShortText({
      displayName: 'Email Address',
      description: 'The email address of the subscriber to find',
      required: true,
    }),
  },
  async run({ propsValue, auth }) {
    const { listId, email } = propsValue;

    try {
      const response = await makeRequest(
        { apiKey: auth as string },
        HttpMethod.GET,
        `/subscribers/${listId}.json?email=${encodeURIComponent(
          email
        )}&includetrackingpreference=true`
      );

      return {
        found: true,
        result: {
            ...response.body,
            CustomFields:transformCustomFields(response.body['CustomFields'])
        },
      };
    } catch (error) {
      // If subscriber is not found, API returns a 404
      return {
        found: false,
        result: null,
      };
    }
  },
});
