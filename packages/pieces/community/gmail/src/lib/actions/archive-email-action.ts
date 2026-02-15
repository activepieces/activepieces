import { createAction } from '@activepieces/pieces-framework';
import { gmailAuth } from '../../';
import { GmailProps } from '../common/props';
import { google } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';

export const gmailArchiveEmailAction = createAction({
  auth: gmailAuth,
  name: 'archive_email',
  displayName: 'Archive Email',
  description: 'Archive an email by removing it from the inbox',
  props: {
    message: GmailProps.message,
  },
  async run(context) {
    const authClient = new OAuth2Client();
    authClient.setCredentials(context.auth);

    const gmail = google.gmail({ version: 'v1', auth: authClient });

    const messageId = context.propsValue.message;

    try {
      const response = await gmail.users.messages.modify({
        userId: 'me',
        id: messageId,
        requestBody: {
          removeLabelIds: ['INBOX'],
        },
      });

      return {
        success: true,
        messageId: messageId,
        response: response.data,
        message: 'Email has been archived successfully',
      };
    } catch (error) {
      throw new Error(`Failed to archive email: ${error.message}`);
    }
  },
});