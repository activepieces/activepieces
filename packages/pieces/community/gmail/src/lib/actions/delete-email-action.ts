import { createAction } from '@activepieces/pieces-framework';
import { gmailAuth } from '../../';
import { GmailProps } from '../common/props';
import { google } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';

export const gmailDeleteEmailAction = createAction({
  auth: gmailAuth,
  name: 'delete_email',
  displayName: 'Delete Email',
  description: 'Delete an email by moving it to trash',
  props: {
    message: GmailProps.message,
  },
  async run(context) {
    const authClient = new OAuth2Client();
    authClient.setCredentials(context.auth);

    const gmail = google.gmail({ version: 'v1', auth: authClient });

    const messageId = context.propsValue.message;

    try {
      const response = await gmail.users.messages.trash({
        userId: 'me',
        id: messageId,
      });

      return {
        success: true,
        messageId: messageId,
        response: response.data,
        message: 'Email has been moved to trash successfully',
      };
    } catch (error) {
      throw new Error(`Failed to delete email: ${error.message}`);
    }
  },
});