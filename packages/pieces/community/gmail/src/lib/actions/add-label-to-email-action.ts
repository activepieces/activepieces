import { createAction, Property } from '@activepieces/pieces-framework';
import { gmailAuth } from '../../';
import { GmailProps } from '../common/props';
import { google } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';

export const gmailAddLabelToEmailAction = createAction({
  auth: gmailAuth,
  name: 'gmail_add_label_to_email',
  displayName: 'Add Label to Email',
  description: 'Add a label to an email message',
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
        addLabelIds: [label.id],
      },
    });

    return response.data;
  },
});
