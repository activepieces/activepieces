import { createAction } from '@activepieces/pieces-framework';
import { gmailAuth } from '../auth';
import { google } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';
import { GmailProps } from '../common/props';

export const gmailRemoveLabelAction = createAction({
  auth: gmailAuth,
  name: 'remove_label_from_email',
  displayName: 'Remove Label from Email',
  description: 'Remove a specific label from an email.',
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
      throw new Error('Please select a label to remove.');
    }

    const response = await gmail.users.messages.modify({
      userId: 'me',
      id: context.propsValue.message_id,
      requestBody: {
        removeLabelIds: [labelId],
      },
    });

    return response.data;
  },
});
