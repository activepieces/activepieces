import { createAction } from '@activepieces/pieces-framework';
import { gmailAuth, createGoogleClient } from '../auth';
import { gmail as googleGmail } from '@googleapis/gmail';
import { GmailProps } from '../common/props';
import {
  getGmailApiErrorCode,
  getGmailApiErrorMessage,
} from '../common/errors';
import { gmailRemoveLabelFromThreadActionOutputSchema } from '../output-schemas';

export const gmailRemoveLabelFromThreadAction = createAction({
  auth: gmailAuth,
  name: 'remove_label_from_thread',
  classification: 'WRITE',
  displayName: 'Remove Label from Thread',
  description: 'Remove a label from all emails in a thread.',
  audience: 'both',
  aiMetadata: {
    description:
      'Strips a label from every message in a Gmail thread identified by its thread ID. Use Remove Label from Email to remove the label from a single message instead. Idempotent: removing a label the thread does not carry succeeds without change.',
    idempotent: true,
  },
  props: {
    thread_id: GmailProps.thread,
    label: GmailProps.label({
      displayName: 'Label',
      description: 'The label to remove from all emails in the thread.',
      required: true,
    }),
  },
  outputSchema: gmailRemoveLabelFromThreadActionOutputSchema,
  async run(context) {
    const authClient = await createGoogleClient(context.auth);
    const gmail = googleGmail({ version: 'v1', auth: authClient });

    try {
      const response = await gmail.users.threads.modify({
        userId: 'me',
        id: context.propsValue.thread_id,
        requestBody: {
          removeLabelIds: [context.propsValue.label.id],
        },
      });
      return response.data;
    } catch (error) {
      const errorCode = getGmailApiErrorCode(error);
      if (errorCode === 403) {
        throw new Error(
          'Insufficient permissions to modify thread labels. Reconnect your Gmail account so the gmail.modify scope is granted.'
        );
      } else if (errorCode === 404) {
        throw new Error(
          `No thread with ID "${context.propsValue.thread_id}" was found.`
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
        `Failed to remove label from thread: ${getGmailApiErrorMessage(error)}`
      );
    }
  },
});
