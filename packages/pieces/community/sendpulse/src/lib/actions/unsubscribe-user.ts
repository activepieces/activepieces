import { createAction, Property } from '@activepieces/pieces-framework';
import { sendPulseAuth } from '../common/auth';
import { sendPulseApiCall } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const unsubscribeUser = createAction({
  auth: sendPulseAuth,
  name: 'unsubscribe-user',
  displayName: 'Unsubscribe User from Mailing List',
  description: 'Unsubscribe one or more users by email from a specific mailing list (up to 100 per request).',
  props: {
    addressBookId: Property.Number({
      displayName: 'Mailing List ID',
      description: 'The ID of the SendPulse mailing list',
      required: true,
    }),
    emails: Property.Array({
      displayName: 'Emails',
      description: 'List of email addresses to unsubscribe from the mailing list (up to 100).',
      required: true,
    }),
  },
  async run(context) {
    const { addressBookId, emails } = context.propsValue;
    if (emails.length > 100) {
      throw new Error('You can unsubscribe up to 100 emails in one request.');
    }
    const body = { emails };
    try {
      const result: any = await sendPulseApiCall({
        method: HttpMethod.POST,
        auth: context.auth,
        resourceUri: `/addressbooks/${addressBookId}/emails/unsubscribe`,
        body,
      });
      if (result.result) {
        return {
          success: true,
          message: 'Users unsubscribed from the mailing list successfully.',
          mailingListId: addressBookId,
          emailsUnsubscribed: emails,
        };
      }
      throw new Error('SendPulse API returned failure during unsubscribe.');
    } catch (error: any) {
      throw new Error(`SendPulse error: ${error.message || 'Unknown error'}`);
    }
  },
});

export const deleteContactFromList = createAction({
  auth: sendPulseAuth,
  name: 'delete-contact-from-list',
  displayName: 'Delete Contact From Mailing List',
  description: 'Permanently delete one or more contacts from a specific mailing list (removes variables, phone, and history in that list only, up to 100 per request).',
  props: {
    addressBookId: Property.Number({
      displayName: 'Mailing List ID',
      description: 'The ID of the SendPulse mailing list',
      required: true,
    }),
    emails: Property.Array({
      displayName: 'Emails',
      description: 'List of email addresses to delete from the mailing list (up to 100).',
      required: true,
    }),
  },
  async run(context) {
    const { addressBookId, emails } = context.propsValue;
    if (emails.length > 100) {
      throw new Error('You can delete up to 100 emails in one request.');
    }
    const body = { emails };
    try {
      const result: any = await sendPulseApiCall({
        method: HttpMethod.DELETE,
        auth: context.auth,
        resourceUri: `/addressbooks/${addressBookId}/emails`,
        body,
      });
      if (result.result) {
        return {
          success: true,
          message: 'Contacts deleted from the mailing list successfully.',
          mailingListId: addressBookId,
          emailsDeleted: emails,
        };
      }
      throw new Error('SendPulse API returned failure during deletion.');
    } catch (error: any) {
      throw new Error(`SendPulse error: ${error.message || 'Unknown error'}`);
    }
  },
}); 