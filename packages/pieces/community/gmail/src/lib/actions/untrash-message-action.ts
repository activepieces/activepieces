import { createAction, Property } from '@activepieces/pieces-framework';
import { gmailAuth, createGoogleClient } from '../auth';
import { gmail as googleGmail } from '@googleapis/gmail';
import { gmailUntrashMessageActionOutputSchema } from '../output-schemas';

export const gmailUntrashMessageAction = createAction({
  auth: gmailAuth,
  name: 'gmail_untrash_message',
  classification: 'WRITE',
  displayName: 'Untrash Message',
  description: 'Restore an email message from Trash.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Removes the TRASH label from a single email message, taking it out of Trash. This does not re-add the INBOX label — the message lands back in All Mail, not necessarily the inbox; use Modify Labels to add INBOX back if it needs to reappear there. Use this to undo Trash Message. Obtain the message ID from Search Email or Get Message. Idempotent: true — untrashing a message that is not in Trash has no additional effect.',
    idempotent: true,
  },
  props: {
    message_id: Property.ShortText({
      displayName: 'Message ID',
      description:
        'The Gmail message ID to restore from Trash (obtain from Search Email or Get Message).',
      required: true,
    }),
  },
  outputSchema: gmailUntrashMessageActionOutputSchema,
  async run(context) {
    const authClient = await createGoogleClient(context.auth);
    const gmail = googleGmail({ version: 'v1', auth: authClient });

    try {
      const response = await gmail.users.messages.untrash({
        userId: 'me',
        id: context.propsValue.message_id,
      });
      return response.data;
    } catch (error: any) {
      if (error.code === 403) {
        throw new Error(
          'Insufficient permissions to untrash a message. Ensure the gmail.modify scope is granted.'
        );
      } else if (error.code === 404) {
        throw new Error(
          `Message not found: "${context.propsValue.message_id}". Use Search Email or Get Message to find a valid message ID.`
        );
      }
      throw new Error(`Failed to untrash message: ${error.message}`);
    }
  },
});
