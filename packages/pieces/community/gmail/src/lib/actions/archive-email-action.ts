import { createAction, Property } from '@activepieces/pieces-framework';
import { gmailAuth, createGoogleClient } from '../auth';
import { gmail as googleGmail } from '@googleapis/gmail';
import { gmailArchiveEmailActionOutputSchema } from '../output-schemas';

export const gmailArchiveEmailAction = createAction({
  auth: gmailAuth,
  name: 'gmail_archive_email',
  classification: 'WRITE',
  displayName: 'Archive Email',
  description: 'Archive an email message by removing it from the inbox.',
  audience: 'both',
  aiMetadata: {
    description:
      'Archives a single email message by message ID, removing the INBOX label so it no longer appears in the inbox while remaining searchable and in its thread. Does not delete the message or move it to Trash. Obtain the message ID from Search Email or Get Message. Idempotent: true — archiving an already-archived message has no additional effect.',
    idempotent: true,
  },
  props: {
    message_id: Property.ShortText({
      displayName: 'Message ID',
      description:
        'The Gmail message ID to archive (obtain from Search Email or Get Message).',
      required: true,
    }),
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
          'Insufficient permissions to modify labels on a message. Ensure the gmail.modify scope is granted.'
        );
      } else if (error.code === 404) {
        throw new Error(
          `Message not found: "${context.propsValue.message_id}". Use Search Email or Get Message to find a valid message ID.`
        );
      }
      throw new Error(`Failed to archive email: ${error.message}`);
    }
  },
});
