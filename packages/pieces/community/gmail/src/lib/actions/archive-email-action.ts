import { createAction, Property } from '@activepieces/pieces-framework';
import { gmailAuth, createGoogleClient } from '../auth';
import { gmail as googleGmail } from '@googleapis/gmail';
import { GmailProps } from '../common/props';
import { gmailArchiveEmailActionOutputSchema } from '../output-schemas';

export const gmailArchiveEmailAction = createAction({
  auth: gmailAuth,
  name: 'archive_email',
  classification: 'WRITE',
  displayName: 'Archive Email',
  description: 'Archive (move to "All Mail") an email rather than deleting it.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Archives a Gmail message by removing the INBOX label, moving it to All Mail without deleting it. Use this to clear the inbox while keeping the message searchable. Requires the gmail.modify scope. Not idempotent in effect, but archiving an already-archived message is a safe no-op.',
    idempotent: false,
  },
  props: {
    message_id: GmailProps.message,
  },
  outputSchema: gmailArchiveEmailActionOutputSchema,
  async run(context) {
    const authClient = await createGoogleClient(context.auth);
    const gmail = googleGmail({ version: 'v1', auth: authClient });

    try {
      const response = await gmail.users.messages.modify({
        userId: 'me',
        id: context.propsValue.message_id,
        requestBody: {
          removeLabelIds: ['INBOX'],
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
      throw new Error(`Failed to archive email: ${error.message}`);
    }
  },
});
