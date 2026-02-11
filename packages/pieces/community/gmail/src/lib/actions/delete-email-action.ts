import { createAction, Property } from '@activepieces/pieces-framework';
import { gmailAuth } from '../../';
import { GmailProps } from '../common/props';
import { google } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';

export const gmailDeleteEmailAction = createAction({
  auth: gmailAuth,
  name: 'gmail_delete_email',
  displayName: 'Delete Email',
  description: 'Move an email to Trash',
  props: {
    message_id: GmailProps.message,
  },
  async run(context) {
    const authClient = new OAuth2Client();
    authClient.setCredentials(context.auth);
    const gmail = google.gmail({ version: 'v1', auth: authClient });

    const messageId = context.propsValue.message_id as unknown as string;

    const response = await gmail.users.messages.trash({
      userId: 'me',
      id: messageId,
    });

    return response.data;
  },
});
