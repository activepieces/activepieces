import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { sendpulseApiCall } from '../common/client';
import { sendpulseAuth } from '../common/auth';
import { mailingListDropdown } from '../common/props';

export const unsubscribeUserAction = createAction({
  auth: sendpulseAuth,
  name: 'unsubscribe-user',
  displayName: 'Unsubscribe User',
  description: 'Remove subscribers from mailing list',
  props: {
    mailingListId: mailingListDropdown,
    emails: Property.Array({
      displayName: 'Email Addresses',
      description: 'Email addresses to unsubscribe (max 100)',
      required: true,
    }),
  },

  async run(context) {
    const { mailingListId, emails } = context.propsValue;

    if (emails.length === 0) {
      throw new Error('At least one email address is required');
    }

    if (emails.length > 100) {
      throw new Error('Maximum 100 email addresses allowed per request');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = emails.filter(email => !emailRegex.test(email as string));
    
    if (invalidEmails.length > 0) {
      throw new Error(`Invalid email format(s): ${invalidEmails.join(', ')}`);
    }

    const body = { emails };

    try {
      const result = await sendpulseApiCall<{ result: boolean }>({
        method: HttpMethod.DELETE,
        auth: context.auth,
        resourceUri: `/addressbooks/${mailingListId}/emails`,
        body,
      });

      if (result.result) {
        return {
          success: true,
          message: `${emails.length} subscriber(s) unsubscribed successfully`,
          unsubscribed: emails,
          mailingListId,
          count: emails.length,
        };
      } else {
        throw new Error('Unsubscription failed - API returned failure');
      }
    } catch (error: any) {
      throw new Error(`Failed to unsubscribe users: ${error.message || 'Unknown error'}`);
    }
  },
});
