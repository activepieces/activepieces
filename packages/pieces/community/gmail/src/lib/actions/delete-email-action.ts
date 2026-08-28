import { createAction, Property } from '@activepieces/pieces-framework';
import { gmailAuth, createGoogleClient } from '../auth';
import { gmail as googleGmail } from '@googleapis/gmail';
import { GmailProps } from '../common/props';
import { gmailDeleteEmailActionOutputSchema } from '../output-schemas';

export const gmailDeleteEmailAction = createAction({
  auth: gmailAuth,
  name: 'delete_email',
  classification: 'WRITE',
  displayName: 'Delete Email',
  description: 'Permanently move an email to Trash.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Sends a Gmail message to Trash (soft delete). The message can be recovered from Trash until it is purged. Use this to remove a message without permanent erasure; for permanent deletion use the Gmail API erase endpoint outside this action. Requires the gmail.modify scope. Not idempotent: deleting an already-deleted message returns 404.',
    idempotent: false,
  },
  props: {
    message_id: GmailProps.message,
  },
  outputSchema: gmailDeleteEmailActionOutputSchema,
  async run(context) {
    const authClient = await createGoogleClient(context.auth);
    const gmail = googleGmail({ version: 'v1', auth: authClient });

    try {
      await gmail.users.messages.trash({
        userId: 'me',
        id: context.propsValue.message_id,
      });
      return {
        id: context.propsValue.message_id,
        trashed: true,
      };
    } catch (error: any) {
      if (error.code === 403) {
        throw new Error(
          'Insufficient permissions to delete the email. Ensure the gmail.modify scope is granted.'
        );
      } else if (error.code === 404) {
        throw new Error(
          `Email not found: "${context.propsValue.message_id}". It may already be deleted.`
        );
      } else if (error.code === 429) {
        throw new Error(
          'Gmail API rate limit exceeded. Please try again later.'
        );
      }
      throw new Error(`Failed to delete email: ${error.message}`);
    }
  },
});
