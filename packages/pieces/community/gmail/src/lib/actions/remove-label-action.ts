import { createAction } from '@activepieces/pieces-framework';
import { gmailAuth } from '../../';
import { google } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';
import { GmailProps } from '../common/props';

export const gmailRemoveLabelAction = createAction({
  auth: gmailAuth,
  name: 'gmail_remove_label',
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

    const label = context.propsValue.label;
    if (!label) {
      throw new Error('Label is required');
    }

    const response = await gmail.users.messages.modify({
      userId: 'me',
      id: context.propsValue.message_id,
      requestBody: {
        removeLabelIds: [label.id],
      },
    });

    return response.data;
  },
});
