import { createAction, Property } from '@activepieces/pieces-framework';
import { OAuth2Client } from 'googleapis-common';
import { google } from 'googleapis';
import { gmailAuth } from '../../';

export const gmailRemoveLabelFromThreadAction = createAction({
  auth: gmailAuth,
  name: 'remove_label_from_thread',
  description: 'Strip a label from all emails in a thread',
  displayName: 'Remove Label from Thread',
  props: {
    threadId: Property.ShortText({
      displayName: 'Thread ID',
      description: 'The ID of the thread you want to modify',
      required: true,
    }),
    labelId: Property.ShortText({
      displayName: 'Label ID',
      description: 'The ID of the label you want to remove from the thread',
      required: true,
    }),
  },
  async run(context) {
    const authClient = new OAuth2Client();
    authClient.setCredentials(context.auth);

    const gmail = google.gmail({ version: 'v1', auth: authClient });

    const result = await gmail.users.threads.modify({
      userId: 'me',
      id: context.propsValue.threadId,
      requestBody: {
        removeLabelIds: [context.propsValue.labelId],
      },
    });

    return result.data;
  },
});
