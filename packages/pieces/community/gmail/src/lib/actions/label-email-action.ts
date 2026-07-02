import { createAction } from '@activepieces/pieces-framework';
import { gmailAuth, getAccessToken, GmailAuthValue } from '../auth';
import { google } from 'googleapis';

export const gmailLabelEmailAction = createAction({
  auth: gmailAuth,
  name: 'label_email',
  displayName: 'Label Email',
  description: 'Apply labels to an email message',
  props: {
    message_id: {
      displayName: 'Message ID',
      description: 'The ID of the message to label',
      singleLine: true,
      required: true,
    },
    label_ids: {
      displayName: 'Label IDs',
      description: 'Comma-separated list of label IDs to apply',
      singleLine: true,
      required: true,
    },
  },
  async run(context) {
    const auth = await getAccessToken(context.auth as GmailAuthValue);
    const gmail = google.gmail({ version: 'v1', auth });

    const labelIds = context.propsValue.label_ids.split(',').map((id: string) => id.trim());

    await gmail.users.messages.modify({
      userId: 'me',
      id: context.propsValue.message_id,
      requestBody: {
        addLabelIds: labelIds,
      },
    });

    return { success: true };
  },
});