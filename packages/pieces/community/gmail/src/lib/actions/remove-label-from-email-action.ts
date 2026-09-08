import { createAction, Property } from '@activepieces/pieces-framework';
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
  audience: 'both',
  aiMetadata: {
    description:
      'Removes an existing label from a single email message by message ID, leaving its other labels untouched. Look up the label with List Labels and the message ID with Search Email or Get Message. Idempotent: true — removing a label the message does not carry has no additional effect.',
    idempotent: true,
  },
  props: {
    message_id: Property.ShortText({
      displayName: 'Message ID',
      description:
        'The Gmail message ID to unlabel (obtain from Search Email or Get Message).',
      required: true,
    }),
    label: GmailProps.label({
      description: 'The label to remove from the message.',
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
