import { createAction } from '@activepieces/pieces-framework';
import { gmailAuth } from '../../';
import { google } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';
import { GmailProps } from '../common/props';
import { GmailLabel } from '../common/models';

export const gmailRemoveLabelFromThreadAction = createAction({
  auth: gmailAuth,
  name: 'gmail_remove_label_from_thread',
  displayName: 'Remove Label from Thread',
  description: 'Remove one or more labels from all emails in a thread.',
  props: {
    thread: GmailProps.thread,
    labels: GmailProps.labels,
  },
  async run(context) {
    const authClient = new OAuth2Client();
    authClient.setCredentials(context.auth);

    const gmail = google.gmail({ version: 'v1', auth: authClient });
    const selectedLabels = context.propsValue.labels as GmailLabel[];
    const labelIds = selectedLabels.map((label) => label.id);

    if (labelIds.length === 0) {
      throw new Error('At least one label must be selected.');
    }

    try {
      const response = await gmail.users.threads.modify({
        userId: 'me',
        id: context.propsValue.thread as string,
        requestBody: {
          removeLabelIds: labelIds,
        },
      });

      return response.data;
    } catch (error: any) {
      if (error.code === 404) {
        throw new Error(
          `Thread with ID ${context.propsValue.thread} not found.`
        );
      }
      throw error;
    }
  },
});
