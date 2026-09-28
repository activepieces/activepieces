import { createAction } from '@activepieces/pieces-framework';
import { gmailAuth, createGoogleClient } from '../auth';
import { gmail as googleGmail } from '@googleapis/gmail';
import { GmailProps } from '../common/props';
import { gmailRemoveLabelFromEmailActionOutputSchema } from '../output-schemas';

export const gmailRemoveLabelFromEmailAction = createAction({
  auth: gmailAuth,
  name: 'gmail_remove_label_from_email',
  classification: 'WRITE',
  displayName: 'Remove Label From Email',
  description: 'Remove a label from an email message.',
  audience: 'human',
  props: {
    message_id: GmailProps.message,
    label: GmailProps.label({
      description: 'Label to remove.',
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
    } catch (error: any) {
      if (error.code === 403) {
        throw new Error(
          'Insufficient permissions to modify labels on a message. Ensure the gmail.modify scope is granted.'
        );
      } else if (error.code === 404) {
        throw new Error(
          `Message not found: "${context.propsValue.message_id}". Use Search Email or Get Message to find a valid message ID.`
        );
      }
      throw new Error(`Failed to remove label from email: ${error.message}`);
    }
  },
});
