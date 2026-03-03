import { createAction } from '@activepieces/pieces-framework';
import { gmailAuth } from '../auth';
import { GmailProps } from '../common/props';
import { google } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';

export const gmailAddLabelAction = createAction({
  auth: gmailAuth,
  name: 'gmail_add_label',
  displayName: 'Add Label to Email',
  description: 'Add a label to an email message.',
  props: {
    message_id: GmailProps.message,
    label: {
      ...GmailProps.label,
      required: true,
    },
  },
  async run(context) {
    const authClient = new OAuth2Client();
    authClient.setCredentials(context.auth);
    const gmail = google.gmail({ version: 'v1', auth: authClient });

    const response = await gmail.users.messages.modify({
      userId: 'me',
      id: context.propsValue.message_id,
      requestBody: {
        addLabelIds: [context.propsValue.label.id],
      },
    });

    return response.data;
  },
});
