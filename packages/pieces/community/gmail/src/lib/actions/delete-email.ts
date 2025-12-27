import { createAction, Property } from '@activepieces/pieces-framework';
import { gmailAuth } from '../../';
import { google } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';

export const gmailDeleteEmailAction = createAction({
  auth: gmailAuth,
  name: 'delete_email',
  description: 'Move an email to trash',
  displayName: 'Delete Email',
  props: {
    message_id: Property.ShortText({
      displayName: 'Message ID',
      description: 'The ID of the email message to delete',
      required: true,
    }),
    permanent: Property.Checkbox({
      displayName: 'Permanently Delete',
      description: 'If checked, permanently deletes the email instead of moving to trash. This action cannot be undone.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const authClient = new OAuth2Client();
    authClient.setCredentials(context.auth);
    const gmail = google.gmail({ version: 'v1', auth: authClient });

    if (context.propsValue.permanent) {
      await gmail.users.messages.delete({
        userId: 'me',
        id: context.propsValue.message_id,
      });
      return { success: true, message: 'Email permanently deleted' };
    } else {
      const response = await gmail.users.messages.trash({
        userId: 'me',
        id: context.propsValue.message_id,
      });
      return response.data;
    }
  },
});
