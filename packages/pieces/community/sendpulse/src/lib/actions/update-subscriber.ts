import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { sendpulseApiCall } from '../common/client';
import { sendpulseAuth } from '../common/auth';
import { mailingListDropdown } from '../common/props';

export const updateSubscriberAction = createAction({
  auth: sendpulseAuth,
  name: 'update-subscriber',
  displayName: 'Update Subscriber',
  description: 'Update the phone number and email of an existing subscriber in a mailing list.',
  props: {
    mailingListId: mailingListDropdown,
    email: Property.ShortText({
      displayName: 'Email Address',
      description: 'Email address of the subscriber to update',
      required: true,
    }),
    phone: Property.ShortText({
      displayName: 'Phone Number',
      description: 'The new phone number to assign to the subscriber',
      required: true,
    }),
  },

  async run(context) {
    const { mailingListId, email, phone } = context.propsValue;

    const body = {
      email,
      phone,
    };

    try {
      const result = await sendpulseApiCall<{ result: boolean }>({
        method: HttpMethod.PUT,
        auth: context.auth,
        resourceUri: `/addressbooks/${mailingListId}/phone`,
        body,
      });

      if (result.result === true) {
        return {
          success: true,
          message: `Subscriber ${email}'s phone number was updated to ${phone}`,
        };
      }

      throw new Error('SendPulse API returned failure while updating phone.');
    } catch (error: any) {
      throw new Error(
        `SendPulse error: ${error.message || 'Unknown error while updating subscriber phone'}`
      );
    }
  },
});
