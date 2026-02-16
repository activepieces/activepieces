import { createAction } from '@activepieces/pieces-framework';
import { gmailAuth } from '../../';
import { GmailProps } from '../common/props';
import { google } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';

export const gmailDeleteEmailAction = createAction({
  auth: gmailAuth,
  name: 'delete_email',
  description: 'Move an email to trash',
  displayName: 'Delete Email',
  props: {
    message: GmailProps.message,
  },
  async run(context) {
    const authClient = new OAuth2Client();
    authClient.setCredentials(context.auth);

    const gmail = google.gmail({ version: 'v1', auth: authClient });

    const messageId = context.propsValue.message;

    // Move to trash using trash method
    const response = await gmail.users.messages.trash({
      userId: 'me',
      id: messageId,
    });

    return response.data;
  },
});
