import { createAction } from '@activepieces/pieces-framework';
import { gmailAuth, createGoogleClient } from '../auth';
import { gmail as googleGmail } from '@googleapis/gmail';
import { GmailProps } from '../common/props';
import {
  getGmailApiErrorCode,
  getGmailApiErrorMessage,
} from '../common/errors';
import { gmailArchiveEmailActionOutputSchema } from '../output-schemas';

export const gmailArchiveEmailAction = createAction({
  auth: gmailAuth,
  name: 'archive_email',
  classification: 'WRITE',
  displayName: 'Archive Email',
  description: 'Archive an email (move it out of the inbox to All Mail).',
  audience: 'both',
  aiMetadata: {
    description:
      'Archives an email message by removing it from the inbox; the message stays in All Mail and keeps its other labels. Use Delete Email to move a message to Trash instead. Idempotent: archiving an already-archived message succeeds without change.',
    idempotent: true,
  },
  props: {
    message_id: GmailProps.message,
  },
  outputSchema: gmailArchiveEmailActionOutputSchema,
  async run(context) {
    const authClient = await createGoogleClient(context.auth);
    const gmail = googleGmail({ version: 'v1', auth: authClient });

    try {
      const response = await gmail.users.messages.modify({
        userId: 'me',
        id: context.propsValue.message_id,
        requestBody: {
          removeLabelIds: ['INBOX'],
        },
      });
      return response.data;
    } catch (error) {
      const errorCode = getGmailApiErrorCode(error);
      if (errorCode === 403) {
        throw new Error(
          'Insufficient permissions to archive messages. Reconnect your Gmail account so the gmail.modify scope is granted.'
        );
      } else if (errorCode === 404) {
        throw new Error(
          `No message with ID "${context.propsValue.message_id}" was found.`
        );
      } else if (errorCode === 429) {
        throw new Error(
          'Gmail API rate limit exceeded. Please try again later.'
        );
      }
      throw new Error(
        `Failed to archive email: ${getGmailApiErrorMessage(error)}`
      );
    }
  },
});
