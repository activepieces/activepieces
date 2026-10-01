import { createAction } from '@activepieces/pieces-framework';
import { gmailAuth, createGoogleClient, GmailAuthValue } from '../auth';
import { gmail as googleGmail } from '@googleapis/gmail';
import { GmailProps } from '../common/props';
import { gmailArchiveEmailActionOutputSchema } from '../output-schemas';

export const gmailArchiveEmailAction = createAction({
  auth: gmailAuth,
  name: 'gmail_archive_email',
  classification: 'WRITE',
  displayName: 'Archive Email',
  description: 'Archive an email message by removing it from the inbox.',
  audience: 'human',
  props: {
    message_id: GmailProps.message,
  },
  outputSchema: gmailArchiveEmailActionOutputSchema,
  async run(context) {
    return archiveGmailMessage({
      auth: context.auth,
      messageId: context.propsValue.message_id,
    });
  },
});

export async function archiveGmailMessage({
  auth,
  messageId,
}: ArchiveGmailMessageParams) {
  const authClient = await createGoogleClient(auth);
  const gmail = googleGmail({ version: 'v1', auth: authClient });

  try {
    const response = await gmail.users.messages.modify({
      userId: 'me',
      id: messageId,
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
        `Message not found: "${messageId}". Use Search Email or Get Message to find a valid message ID.`
      );
    }
    throw new Error(`Failed to archive email: ${error.message}`);
  }
}

type ArchiveGmailMessageParams = {
  auth: GmailAuthValue;
  messageId: string;
};
