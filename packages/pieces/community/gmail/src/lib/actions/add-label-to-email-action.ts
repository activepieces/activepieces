import { createAction } from '@activepieces/pieces-framework';
import { gmailAuth, createGoogleClient } from '../auth';
import { gmail as googleGmail } from '@googleapis/gmail';
import { GmailProps } from '../common/props';
import {
  getGmailApiErrorCode,
  getGmailApiErrorMessage,
} from '../common/errors';
import { gmailAddLabelToEmailActionOutputSchema } from '../output-schemas';

export const gmailAddLabelToEmailAction = createAction({
  auth: gmailAuth,
  name: 'add_label_to_email',
  classification: 'WRITE',
  displayName: 'Add Label to Email',
  description: 'Add a label to an individual email.',
  audience: 'both',
  aiMetadata: {
    description:
      'Adds an existing label to a single email message identified by its Gmail message ID. Use Create Label first if the label does not exist, or Remove Label from Email to undo. Idempotent: adding a label the message already carries succeeds without change.',
    idempotent: true,
  },
  props: {
    message_id: GmailProps.message,
    label: GmailProps.label({
      displayName: 'Label',
      description: 'The label to add to the email.',
      required: true,
    }),
  },
  outputSchema: gmailAddLabelToEmailActionOutputSchema,
  async run(context) {
    const authClient = await createGoogleClient(context.auth);
    const gmail = googleGmail({ version: 'v1', auth: authClient });

    try {
      const response = await gmail.users.messages.modify({
        userId: 'me',
        id: context.propsValue.message_id,
        requestBody: {
          addLabelIds: [context.propsValue.label.id],
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
        `Failed to add label to email: ${getGmailApiErrorMessage(error)}`
      );
    }
  },
});
