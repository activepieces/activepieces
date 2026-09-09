import { createAction, Property } from '@activepieces/pieces-framework';
import { gmailAuth, createGoogleClient } from '../auth';
import { gmail as googleGmail } from '@googleapis/gmail';
import { GmailProps } from '../common/props';
import { gmailAddLabelToEmailActionOutputSchema } from '../output-schemas';

export const gmailAddLabelToEmailAction = createAction({
  auth: gmailAuth,
  name: 'gmail_add_label_to_email',
  classification: 'WRITE',
  displayName: 'Add Label to Email',
  description: 'Apply a label to an email message.',
  audience: 'both',
  aiMetadata: {
    description:
      'Applies an existing label to a single email message by message ID, without removing any of its current labels. Look up the label with List Labels and the message ID with Search Email or Get Message. Idempotent: true — applying a label the message already carries has no additional effect.',
    idempotent: true,
  },
  props: {
    message_id: Property.ShortText({
      displayName: 'Message ID',
      description:
        'The Gmail message ID to label (obtain from Search Email or Get Message).',
      required: true,
    }),
    label: GmailProps.label({
      description: 'The label to apply to the message.',
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
      throw new Error(`Failed to add label to email: ${error.message}`);
    }
  },
});
