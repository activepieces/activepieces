import { createAction } from '@activepieces/pieces-framework';
import { gmailAuth, getAccessToken, GmailAuthValue } from '../auth';
import { google } from 'googleapis';

export const gmailArchiveEmailAction = createAction({
  auth: gmailAuth,
  name: 'archive_email',
  displayName: 'Archive Email',
  description: 'Archive an email message',
  props: {
    message_id: {
      displayName: 'Message ID',
      description: 'The ID of the message to archive',
      singleLine: true,
      required: true,
    },
  },
  async run(context) {
    const auth = await getAccessToken(context.auth as GmailAuthValue);
    const gmail = google.gmail({ version: 'v1', auth });

    await gmail.users.messages.modify({
      userId: 'me',
      id: context.propsValue.message_id,
      requestBody: {
        removeLabelIds: ['INBOX'],
      },
    });

    return { success: true };
  },
});