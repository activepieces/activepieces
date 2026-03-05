import { createAction } from '@activepieces/pieces-framework';
import { GmailProps } from '../common/props';
import { gmailAuth } from '../auth';
import { google } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';

export const gmailRemoveLabelFromThreadAction = createAction({
  auth: gmailAuth,
  name: 'gmail_remove_label_from_thread',
  displayName: 'Remove Label from Thread',
  description: 'Remove a label from all emails in a thread',
  props: {
    thread: GmailProps.thread,
    label: GmailProps.label,
  },
  async run(context) {
    const authClient = new OAuth2Client();
    authClient.setCredentials(context.auth);
    const gmail = google.gmail({ version: 'v1', auth: authClient });

    const response = await gmail.users.threads.modify({
      userId: 'me',
      id: context.propsValue.thread as string,
      requestBody: {
        removeLabelIds: [context.propsValue.label.id],
      },
    });
    return response.data;
  },
});
