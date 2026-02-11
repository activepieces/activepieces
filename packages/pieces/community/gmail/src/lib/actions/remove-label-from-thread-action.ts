import { createAction, Property } from '@activepieces/pieces-framework';
import { gmailAuth } from '../../';
import { GmailProps } from '../common/props';
import { google } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';

export const gmailRemoveLabelFromThreadAction = createAction({
  auth: gmailAuth,
  name: 'gmail_remove_label_from_thread',
  displayName: 'Remove Label from Thread',
  description: 'Remove a label from all messages in a thread',
  props: {
    thread_id: GmailProps.thread,
    label: GmailProps.label,
  },
  async run(context) {
    const authClient = new OAuth2Client();
    authClient.setCredentials(context.auth);
    const gmail = google.gmail({ version: 'v1', auth: authClient });

    const threadId = context.propsValue.thread_id as unknown as string;
    const label = context.propsValue.label;

    const response = await gmail.users.threads.modify({
      userId: 'me',
      id: threadId,
      requestBody: {
        removeLabelIds: [label.id],
      },
    });

    return response.data;
  },
});
