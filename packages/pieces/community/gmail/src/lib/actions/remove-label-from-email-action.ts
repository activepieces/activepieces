import { createAction } from '@activepieces/pieces-framework';
import { gmailAuth, createGoogleClient } from '../auth';
import { gmail as googleGmail } from '@googleapis/gmail';
import { GmailProps } from '../common/props';
import {
  getGmailApiErrorCode,
  getGmailApiErrorMessage,
} from '../common/errors';
import { gmailRemoveLabelFromEmailActionOutputSchema } from '../output-schemas';

export const gmailRemoveLabelFromEmailAction = createAction({
  auth: gmailAuth,
  name: 'remove_label_from_email',
  classification: 'WRITE',
  displayName: 'Remove Label from Email',
  description: 'Remove a specific label from an email.',
  audience: 'both',
  aiMetadata: {
    description:
      'Removes a label from a single email message identified by its Gmail message ID. Use Remove Label from Thread to strip the label from every message in a conversation instead. Idempotent: removing a label the message does not carry succeeds without change.',
    idempotent: true,
  },
  props: {
    message_id: GmailProps.message,
    label: GmailProps.label({
      displayName: 'Label',
      description: 'The label to remove from the email.',
      required: true,
    }),
  },
  outputSchema: gmailRemoveLabelFromEmailActionOutputSchema,
  async run(context) {
    const authClient = await createGoogleClient(context.auth);
    const gmail = googleGmail({ version: 'v1', auth: authClient });

    try {
      const response = await gmail.users.messages.modify({
        userId: 'me',
        id: context.propsValue.message_id,
        requestBody: {
          removeLabelIds: [context.propsValue.label.id],
        },
      });
      return response.data;
    } catch (error) {
      const errorCode = getGmailApiErrorCode(error);
      if (errorCode === 403) {
        throw new Error(
          'Insufficient permissions to modify message labels. Reconnect your Gmail account so the gmail.modify scope is granted.'
        );
      } else if (errorCode === 404) {
        throw new Error(
          `No message with ID "${context.propsValue.message_id}" was found.`
        );
      } else if (errorCode === 400) {
        throw new Error(
          `Invalid label "${context.propsValue.label.name}". It may have been deleted — refresh the label list and try again.`
        );
      } else if (errorCode === 429) {
        throw new Error(
          'Gmail API rate limit exceeded. Please try again later.'
        );
      }
      throw new Error(
        `Failed to remove label from email: ${getGmailApiErrorMessage(error)}`
      );
    }
  },
});
