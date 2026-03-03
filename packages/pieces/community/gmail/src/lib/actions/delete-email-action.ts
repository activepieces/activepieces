import { createAction } from '@activepieces/pieces-framework';
import { gmailAuth } from '../auth';
import { GmailProps } from '../common/props';
import { google } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';

export const gmailDeleteEmailAction = createAction({
  auth: gmailAuth,
  name: 'gmail_delete_email',
  displayName: 'Delete Email',
  description: 'Move an email to the trash.',
  props: {
    message_id: GmailProps.message,
  },
  async run(context) {
    const authClient = new OAuth2Client();
    authClient.setCredentials(context.auth);
    const gmail = google.gmail({ version: 'v1', auth: authClient });

    const response = await gmail.users.messages.trash({
      userId: 'me',
      id: context.propsValue.message_id,
    });

    return response.data;
  },
});
