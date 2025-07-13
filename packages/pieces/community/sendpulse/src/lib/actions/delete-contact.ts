import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { sendpulseApiCall } from '../common/client';
import { sendpulseAuth } from '../common/auth';

export const deleteContactAction = createAction({
  auth: sendpulseAuth,
  name: 'delete-contact',
  displayName: 'Delete Contact From Mailing List',
  description:
    'Permanently delete one or more contacts from a specific mailing list (removes variables, phone, and history in that list only).',
  props: {
    mailingListId: Property.Number({
      displayName: 'Mailing List ID',
      description: 'The ID of the SendPulse mailing list',
      required: true,
    }),
    emails: Property.Array({
      displayName: 'Emails',
      description:
        'List of email addresses to delete from the mailing list (up to 100). This will remove all associated variables for each contact.',
      required: true,
    }),
  },

  async run(context) {
    const { mailingListId, emails } = context.propsValue;

    if (emails.length > 100) {
      throw new Error('You can delete up to 100 emails in one request.');
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
          message: 'Contacts deleted from the mailing list successfully.',
          mailingListId,
          emailsDeleted: emails,
        };
      }

      throw new Error('SendPulse API returned failure during deletion.');
    } catch (error: any) {
      throw new Error(`SendPulse error: ${error.message || 'Unknown error'}`);
    }
  },
});
