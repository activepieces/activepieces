import { createAction } from '@activepieces/pieces-framework';
import { gmailAuth } from '../../';
import { google } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';
import { GmailProps } from '../common/props';

export const gmailAddLabelToEmailAction = createAction({
  auth: gmailAuth,
  name: 'gmail_add_label_to_email',
  displayName: 'Add Label to Email',
  description: 'Attach a label to an individual email.',
  props: {
    message_id: GmailProps.message,
    label: {
      ...GmailProps.label,
      required: true,
      description: 'The label to add to the email.',
    },
  },
  async run(context) {
    const authClient = new OAuth2Client();
    authClient.setCredentials(context.auth);

    const gmail = google.gmail({ version: 'v1', auth: authClient });

    const label = context.propsValue.label as { id: string; name: string };

    const response = await gmail.users.messages.modify({
      userId: 'me',
      id: context.propsValue.message_id,
      requestBody: {
        addLabelIds: [label.id],
      },
    });

    return response.data;
  },
});
