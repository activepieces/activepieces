import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { sendpulseApiCall } from '../common/client';
import { sendpulseAuth } from '../common/auth';

export const unsubscribeUserAction = createAction({
  auth: sendpulseAuth,
  name: 'unsubscribe-user',
  displayName: 'Unsubscribe User',
  description: 'Unsubscribes one or more users by email from a specific mailing list.',
  props: {
    mailingListId: Property.Number({
      displayName: 'Mailing List ID',
      description: 'The ID of the SendPulse mailing list (address book)',
      required: true,
    }),
    emails: Property.Array({
      displayName: 'Emails',
      description: 'One or more email addresses to unsubscribe (max 100)',
      required: true,
    }),
  },

  async run(context) {
    const { mailingListId, emails } = context.propsValue;

    if (emails.length > 100) {
      throw new Error('You can unsubscribe up to 100 emails in one request.');
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
          message: 'Users unsubscribed successfully.',
          unsubscribed: emails,
          mailingListId,
        };
      } else {
        throw new Error('Unsubscription failed.');
      }
    } catch (error: any) {
      throw new Error(`SendPulse error: ${error.message}`);
    }
  },
});
