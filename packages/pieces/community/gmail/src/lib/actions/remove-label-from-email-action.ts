import { createAction, Property } from '@activepieces/pieces-framework';
import { gmailAuth } from '../../';
import { GmailProps } from '../common/props';
import { google } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';

export const gmailRemoveLabelFromEmailAction = createAction({
  auth: gmailAuth,
  name: 'gmail_remove_label_from_email',
  displayName: 'Remove Label from Email',
  description: 'Remove a label from an email message',
  props: {
    message_id: GmailProps.message,
    label: GmailProps.label,
  },
  async run(context) {
    const authClient = new OAuth2Client();
    authClient.setCredentials(context.auth);
    const gmail = google.gmail({ version: 'v1', auth: authClient });

    const messageId = context.propsValue.message_id as unknown as string;
    const label = context.propsValue.label;

    const response = await gmail.users.messages.modify({
      userId: 'me',
      id: messageId,
      requestBody: {
        removeLabelIds: [label.id],
      },
    });

    return response.data;
  },
});
