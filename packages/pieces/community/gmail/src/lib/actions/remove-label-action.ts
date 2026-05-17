import { createAction } from '@activepieces/pieces-framework';
import { google } from 'googleapis';
import { gmailAuth, createGoogleClient } from '../auth';
import { GmailProps } from '../common/props';

export const gmailRemoveLabelAction = createAction({
  auth: gmailAuth,
  name: 'remove_label_from_email',
  displayName: 'Remove Label from Email',
  description: 'Remove one or more labels from an existing email message.',
  props: {
    message_id: GmailProps.message,
    label_ids: GmailProps.labelIds,
  },
  async run(context) {
    const authClient = await createGoogleClient(context.auth);
    const gmail = google.gmail({ version: 'v1', auth: authClient });

    const labelIds = context.propsValue.label_ids ?? [];

    const response = await gmail.users.messages.modify({
      userId: 'me',
      id: context.propsValue.message_id,
      requestBody: {
        removeLabelIds: labelIds,
      },
    });

    return response.data;
  },
});
