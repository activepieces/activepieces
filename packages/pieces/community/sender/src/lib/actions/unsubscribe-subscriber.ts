import { createAction, Property } from '@activepieces/pieces-framework';
import { makeSenderRequest, senderAuth } from '../common/common';
import { HttpMethod } from '@activepieces/pieces-common';



export const unsubscribeSubscriberAction = createAction({
  auth: senderAuth,
  name: 'unsubscribe_subscriber',
  displayName: 'Unsubscribe Subscriber',
  description: 'Mark an email address as unsubscribed globally or from a group',
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Subscriber email address',
      required: true,
    }),
  },
  async run(context) {
    const email = context.propsValue.email;
    const getResponse = await makeSenderRequest(
      context.auth,
      `/subscribers?email=${encodeURIComponent(email)}`
    );

    if (!getResponse.body.data || getResponse.body.data.length === 0) {
      throw new Error(`Subscriber with email ${email} not found`);
    }

    const subscriberId = getResponse.body.data[0].id;

   
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