import { createAction, Property } from '@activepieces/pieces-framework';
import { mailchimpCommon } from '../common';
import { mailchimpAuth } from '../..';

export const unsubscribeEmail = createAction({
  auth: mailchimpAuth,
  name: 'unsubscribe_email',
  displayName: 'Unsubscribe Email',
  description: 'Unsubscribe an email address from a Mailchimp audience',
  props: {
    list_id: mailchimpCommon.mailChimpListIdDropdown,
    email: Property.ShortText({
      displayName: 'Email Address',
      description: 'The email address to unsubscribe',
      required: true,
    }),
  },
  async run(context) {
    try {
      const subscriberHash = mailchimpCommon.getMD5EmailHash(context.propsValue.email!);
      
      const response = await mailchimpCommon.makeApiRequest(
        context.auth,
        `/lists/${context.propsValue.list_id}/members/${subscriberHash}`,
        'PATCH' as any,
        {
          status: 'unsubscribed',
        }
      );

      return response.body;
    } catch (error) {
      throw new Error(`Failed to unsubscribe email: ${JSON.stringify(error)}`);
    }
  },
});
