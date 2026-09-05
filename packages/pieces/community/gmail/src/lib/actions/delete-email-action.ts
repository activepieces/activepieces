import { createAction } from '@activepieces/pieces-framework';
import { gmailAuth, createGoogleClient } from '../auth';
import { gmail as googleGmail } from '@googleapis/gmail';
import { GmailProps } from '../common/props';
import {
  getGmailApiErrorCode,
  getGmailApiErrorMessage,
} from '../common/errors';
import { gmailDeleteEmailActionOutputSchema } from '../output-schemas';

export const gmailDeleteEmailAction = createAction({
  auth: gmailAuth,
  name: 'delete_email',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Email',
  description: 'Move an email to Trash.',
  audience: 'both',
  aiMetadata: {
    description:
      'Moves an email message to Trash by its Gmail message ID; Gmail permanently purges trashed mail after about 30 days. Use Archive Email to remove a message from the inbox without deleting it. Idempotent: trashing an already-trashed message succeeds without change.',
    idempotent: true,
  },
  props: {
    message_id: GmailProps.message,
  },
  outputSchema: gmailDeleteEmailActionOutputSchema,
  async run(context) {
    const authClient = await createGoogleClient(context.auth);
    const gmail = googleGmail({ version: 'v1', auth: authClient });

    try {
      const response = await gmail.users.messages.trash({
        userId: 'me',
        id: context.propsValue.message_id,
      });
      return response.data;
    } catch (error) {
      const errorCode = getGmailApiErrorCode(error);
      if (errorCode === 403) {
        throw new Error(
          'Insufficient permissions to trash messages. Reconnect your Gmail account so the gmail.modify scope is granted.'
        );
      } else if (errorCode === 404) {
        throw new Error(
          `No message with ID "${context.propsValue.message_id}" was found — it may already be deleted, or the ID is invalid.`
        );
      } else if (errorCode === 429) {
        throw new Error(
          'Gmail API rate limit exceeded. Please try again later.'
        );
      }
      throw new Error(
        `Failed to delete email: ${getGmailApiErrorMessage(error)}`
      );
    }
  },
});
