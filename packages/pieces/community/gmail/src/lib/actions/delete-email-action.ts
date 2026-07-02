import { createAction } from '@activepieces/pieces-framework';
import { gmailAuth, getAccessToken, GmailAuthValue } from '../auth';
import { google } from 'googleapis';

export const gmailDeleteEmailAction = createAction({
  auth: gmailAuth,
  name: 'delete_email',
  displayName: 'Delete Email',
  description: 'Permanently delete an email message',
  props: {
    message_id: {
      displayName: 'Message ID',
      description: 'The ID of the message to delete',
      singleLine: true,
      required: true,
    },
  },
  async run(context) {
    const auth = await getAccessToken(context.auth as GmailAuthValue);
    const gmail = google.gmail({ version: 'v1', auth });

    await gmail.users.messages.delete({
      userId: 'me',
      id: context.propsValue.message_id,
    });

    return { success: true };
  },
});