import { createAction, Property } from '@activepieces/pieces-framework';
import { OAuth2Client } from 'googleapis-common';
import { google } from 'googleapis';
import { gmailAuth } from '../../';

export const gmailArchiveEmailAction = createAction({
  auth: gmailAuth,
  name: 'archive_email',
  description: 'Archive (move to “All Mail”) rather than deleting',
  displayName: 'Archive Email',
  props: {
    messageId: Property.ShortText({
      displayName: 'Message ID',
      description: 'The ID of the email you want to archive',
      required: true,
    }),
  },
  async run(context) {
    const authClient = new OAuth2Client();
    authClient.setCredentials(context.auth);

    const gmail = google.gmail({ version: 'v1', auth: authClient });

    const result = await gmail.users.messages.modify({
      userId: 'me',
      id: context.propsValue.messageId,
      requestBody: {
        removeLabelIds: ['INBOX'],
      },
    });

    return result.data;
  },
});
