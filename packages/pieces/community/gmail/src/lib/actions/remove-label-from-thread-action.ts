import { createAction, Property } from '@activepieces/pieces-framework';
import { gmailAuth } from '../../';
import { GmailProps } from '../common/props';
import { GmailLabel } from '../common/models';
import { google } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';

export const gmailRemoveLabelFromThreadAction = createAction({
  auth: gmailAuth,
  name: 'remove_label_from_thread',
  description: 'Remove a label from all emails in a thread',
  displayName: 'Remove Label from Thread',
  props: {
    thread_id: Property.ShortText({
      displayName: 'Thread ID',
      description: 'The ID of the thread to remove the label from',
      required: true,
    }),
    label: {
      ...GmailProps.label,
      required: true,
    },
  },
  async run(context) {
    const authClient = new OAuth2Client();
    authClient.setCredentials(context.auth);

    const gmail = google.gmail({ version: 'v1', auth: authClient });

    const label = context.propsValue.label as GmailLabel;

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
