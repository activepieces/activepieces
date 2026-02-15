import { createAction } from '@activepieces/pieces-framework';
import { gmailAuth } from '../../';
import { google } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';
import { GmailProps } from '../common/props';
import { GmailLabel } from '../common/models';

export const gmailRemoveLabelAction = createAction({
  auth: gmailAuth,
  name: 'remove_label_from_email',
  description: 'Remove a label from an email message.',
  displayName: 'Remove Label from Email',
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

    const messageId = context.propsValue.message_id as string;
    const label = context.propsValue.label as GmailLabel;

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
