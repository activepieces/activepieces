import { createAction, Property } from '@activepieces/pieces-framework';
import { gmailAuth, createGoogleClient } from '../auth';
import { gmail as googleGmail } from '@googleapis/gmail';
import { GmailProps } from '../common/props';
import { gmailRemoveLabelFromEmailActionOutputSchema } from '../output-schemas';

export const gmailRemoveLabelFromEmailAction = createAction({
  auth: gmailAuth,
  name: 'remove_label_from_email',
  classification: 'WRITE',
  displayName: 'Remove Label from Email',
  description: 'Remove a specific label from an email.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Removes a label from a specific Gmail message, identified by its message ID and label ID. Use this to un-flag or de-categorize a message (for example, removing STARRED). Requires the gmail.modify scope. Not idempotent in effect, but removing an absent label is a safe no-op on the mailbox.',
    idempotent: false,
  },
  props: {
    message_id: GmailProps.message,
    label: GmailProps.label({ required: true }),
  },
  outputSchema: gmailRemoveLabelFromEmailActionOutputSchema,
  async run(context) {
    const authClient = await createGoogleClient(context.auth);
    const gmail = googleGmail({ version: 'v1', auth: authClient });

    const label = context.propsValue.label;
    const labelId = (label as { id?: string }).id;

    if (!labelId) {
      throw new Error(
        'The selected label does not have a valid ID. Please choose a label or provide one manually.'
      );
    }

    try {
      const response = await gmail.users.messages.modify({
        userId: 'me',
        id: context.propsValue.message_id,
        requestBody: {
          removeLabelIds: [labelId],
        },
      });
      return response.data;
    } catch (error: any) {
      if (error.code === 403) {
        throw new Error(
          'Insufficient permissions to modify the email. Ensure the gmail.modify scope is granted.'
        );
      } else if (error.code === 404) {
        throw new Error(
          `Email not found: "${context.propsValue.message_id}". Use the Message dropdown to pick a valid message ID.`
        );
      } else if (error.code === 429) {
        throw new Error(
          'Gmail API rate limit exceeded. Please try again later.'
        );
      }
      throw new Error(`Failed to remove label from email: ${error.message}`);
    }
  },
});
