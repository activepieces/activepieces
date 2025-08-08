import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { sendpulseApiCall } from '../common/client';
import { sendpulseAuth } from '../common/auth';

export const deleteContactAction = createAction({
  auth: sendpulseAuth,
  name: 'delete-contact',
  displayName: 'Delete Contact',
  description: 'Permanently delete contact from all mailing lists',
  props: {
    email: Property.ShortText({
      displayName: 'Email Address',
      description: 'Email address to delete from all mailing lists',
      required: true,
    }),
  },

  async run(context) {
    const { email } = context.propsValue;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error(`Invalid email format: ${email}`);
    }

    try {
      const result = await sendpulseApiCall<{ result: boolean }>({
        method: HttpMethod.DELETE,
        auth: context.auth,
        resourceUri: `/emails/${encodeURIComponent(email)}`,
      });

      if (result.result) {
        return {
          success: true,
          message: `Contact ${email} deleted from all mailing lists`,
          email,
        };
      }

      throw new Error('SendPulse API returned failure');
    } catch (error: any) {
      throw new Error(`Failed to delete contact: ${error.message || 'Unknown error'}`);
    }
  },
});
