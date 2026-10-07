import { createAction, Property } from '@activepieces/pieces-framework';
import { gmailAuth, createGoogleClient } from '../auth';
import { gmail as googleGmail } from '@googleapis/gmail';
import { gmailTrashMessageActionOutputSchema } from '../output-schemas';

export const gmailTrashMessageAction = createAction({
  auth: gmailAuth,
  name: 'gmail_trash_message',
  classification: 'WRITE',
  displayName: 'Trash Message',
  description: 'Move an email message to Trash.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Moves a single email message to Trash by message ID. This is recoverable (via Untrash Message or from the Trash folder for 30 days) and is not a permanent delete. Obtain the message ID from Search Email or Get Message. Idempotent: true — trashing an already-trashed message has no additional effect.',
    idempotent: true,
  },
  props: {
    message_id: Property.ShortText({
      displayName: 'Message ID',
      description:
        'The Gmail message ID to move to Trash (obtain from Search Email or Get Message).',
      required: true,
    }),
  },
  outputSchema: gmailTrashMessageActionOutputSchema,
  async run(context) {
    const authClient = await createGoogleClient(context.auth);
    const gmail = googleGmail({ version: 'v1', auth: authClient });

    try {
      const response = await gmail.users.messages.trash({
        userId: 'me',
        id: context.propsValue.message_id,
      });
      return response.data;
    } catch (error: any) {
      if (error.code === 403) {
        throw new Error(
          'Insufficient permissions to trash a message. Ensure the gmail.modify scope is granted.'
        );
      } else if (error.code === 404) {
        throw new Error(
          `Message not found: "${context.propsValue.message_id}". Use Search Email or Get Message to find a valid message ID.`
        );
      }
      throw new Error(`Failed to trash message: ${error.message}`);
    }
  },
});
