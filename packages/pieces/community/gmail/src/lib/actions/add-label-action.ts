import { createAction } from '@activepieces/pieces-framework';
import { google } from 'googleapis';
import { gmailAuth, createGoogleClient } from '../auth';
import { GmailProps } from '../common/props';

export const gmailAddLabelAction = createAction({
  auth: gmailAuth,
  name: 'add_label_to_email',
  displayName: 'Add Label to Email',
  description: 'Add one or more labels to an existing email message.',
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
        addLabelIds: labelIds,
      },
    });

    return response.data;
  },
});
