import { createAction } from '@activepieces/pieces-framework';
import { gmailAuth } from '../auth';
import { google } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';
import { GmailProps } from '../common/props';

export const gmailAddLabelAction = createAction({
  auth: gmailAuth,
  name: 'add_label_to_email',
  displayName: 'Add Label to Email',
  description: 'Attach a label to an individual email.',
  props: {
    message_id: GmailProps.message,
    label: GmailProps.label,
  },
  async run(context) {
    const authClient = new OAuth2Client();
    authClient.setCredentials(context.auth);

    const gmail = google.gmail({ version: 'v1', auth: authClient });

    const labelId = context.propsValue.label?.id;
    if (!labelId) {
      throw new Error('Please select a label to add.');
    }

    const response = await gmail.users.messages.modify({
      userId: 'me',
      id: context.propsValue.message_id,
      requestBody: {
        addLabelIds: [labelId],
      },
    });

    return response.data;
  },
});
