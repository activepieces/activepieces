import { createAction } from '@activepieces/pieces-framework';
import { gmailAuth, createGoogleClient } from '../auth';
import { google } from 'googleapis';
import { GmailProps } from '../common/props';

export const gmailArchiveEmailAction = createAction({
  auth: gmailAuth,
  name: 'archive_email',
  displayName: 'Archive Email',
  description: 'Archive an email by removing it from the inbox (moves to "All Mail").',
  props: {
    message_id: GmailProps.message,
  },
  async run(context) {
    const authClient = await createGoogleClient(context.auth);
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
