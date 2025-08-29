import { createAction, Property } from '@activepieces/pieces-framework';
import { mailchimpCommon } from '../common';
import { mailchimpAuth } from '../auth';

export const findSubscriber = createAction({
  auth: mailchimpAuth,
  name: 'find_subscriber',
  displayName: 'Find Subscriber',
  description: 'Find a subscriber in a Mailchimp audience',
  props: {
    list_id: mailchimpCommon.mailChimpListIdDropdown,
    email: Property.ShortText({
      displayName: 'Email Address',
      description: 'The email address of the subscriber to find',
      required: true,
    }),
  },
  async run(context) {
    try {
      const subscriberHash = mailchimpCommon.getMD5EmailHash(context.propsValue.email!);
      
      const response = await mailchimpCommon.makeApiRequest(
        context.auth,
        `/lists/${context.propsValue.list_id}/members/${subscriberHash}`
      );

      return response.body;
    } catch (error) {
      throw new Error(`Failed to find subscriber: ${JSON.stringify(error)}`);
    }
  },
});
