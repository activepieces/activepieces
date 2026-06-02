import { createAction, Property } from '@activepieces/pieces-framework';
import { gmailAuth, createGoogleClient } from '../auth';
import { google } from 'googleapis';

export const gmailDeleteEmailAction = createAction({
  auth: gmailAuth,
  name: 'gmail_delete_email',
  displayName: 'Delete Email',
  description: 'Move an email to trash.',
  props: {
    message_id: Property.ShortText({
      displayName: 'Message ID',
      description: 'The ID of the email message to delete.',
      required: true,
    }),
  },
  async run(context) {
    const authClient = await createGoogleClient(context.auth);
    const gmail = google.gmail({ version: 'v1', auth: authClient });

    const response = await gmail.users.messages.trash({
      userId: 'me',
      id: context.propsValue.message_id,
    });

    return response.data;
  },
});
