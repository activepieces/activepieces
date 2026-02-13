import { createAction } from '@activepieces/pieces-framework';
import { gmailAuth } from '../../';
import { google } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';
import { GmailProps } from '../common/props';

export const gmailArchiveEmailAction = createAction({
  auth: gmailAuth,
  name: 'gmail_archive_email',
  displayName: 'Archive Email',
  description: 'Archive an email by removing it from the inbox.',
  props: {
    message_id: GmailProps.message,
  },
  async run(context) {
    const authClient = new OAuth2Client();
    authClient.setCredentials(context.auth);

    const gmail = google.gmail({ version: 'v1', auth: authClient });

    const response = await gmail.users.messages.modify({
      userId: 'me',
      id: context.propsValue.message_id,
      requestBody: {
        removeLabelIds: ['INBOX'],
      },
    });

    return response.data;
  },
});
