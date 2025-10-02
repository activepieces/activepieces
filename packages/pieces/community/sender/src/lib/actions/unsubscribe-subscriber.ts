import { createAction, Property } from '@activepieces/pieces-framework';
import { SenderAuth } from '../common/auth';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';
import { subscriberDropdown } from '../common/dropdown';

export const unsubscribeSubscriber = createAction({
  auth: SenderAuth,
  name: 'unsubscribeSubscriber',
  displayName: 'Unsubscribe Subscriber',
  description: "Delete one or more subscribers from your Sender account",
  props: {
    subscribers: subscriberDropdown,
  },
  async run({ auth, propsValue }) {
    const body = {
      subscribers: propsValue.subscribers,
    };
    try {
      const response = await makeRequest(
        auth as string,
        HttpMethod.DELETE,
        "/subscribers",
        body
      );
      return {
        success: true,
        data: response,
      };
    } catch (err: any) {
      throw new Error(`Sender API error: ${err.message}`);
    }
  },
});