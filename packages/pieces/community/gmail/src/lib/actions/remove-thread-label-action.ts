import { createAction } from '@activepieces/pieces-framework';
import { gmailAuth } from '../auth';
import { google } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';
import { GmailProps } from '../common/props';

export const gmailRemoveThreadLabelAction = createAction({
  auth: gmailAuth,
  name: 'remove_label_from_thread',
  displayName: 'Remove Label from Thread',
  description: 'Remove a label from all emails in a thread.',
  props: {
    thread_id: GmailProps.thread,
    label: GmailProps.label,
  },
  async run(context) {
    const authClient = new OAuth2Client();
    authClient.setCredentials(context.auth);

    const gmail = google.gmail({ version: 'v1', auth: authClient });

    const labelId = context.propsValue.label?.id;
    if (!labelId) {
      throw new Error('Please select a label to remove.');
    }

    const response = await gmail.users.threads.modify({
      userId: 'me',
      id: context.propsValue.thread_id,
      requestBody: {
        removeLabelIds: [labelId],
      },
    });

    return response.data;
  },
});
