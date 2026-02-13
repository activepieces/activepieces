import { createAction } from '@activepieces/pieces-framework';
import { gmailAuth } from '../../';
import { google } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';
import { GmailProps } from '../common/props';

export const gmailRemoveThreadLabelAction = createAction({
  auth: gmailAuth,
  name: 'gmail_remove_thread_label',
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

    const label = context.propsValue.label;
    if (!label) {
      throw new Error('Label is required');
    }

    const response = await gmail.users.threads.modify({
      userId: 'me',
      id: context.propsValue.thread_id,
      requestBody: {
        removeLabelIds: [label.id],
      },
    });

    return response.data;
  },
});
