import { createAction, Property } from '@activepieces/pieces-framework';
import { gmailAuth, createGoogleClient } from '../auth';
import { google } from 'googleapis';
import { GmailProps } from '../common/props';

export const gmailRemoveLabelFromThreadAction = createAction({
  auth: gmailAuth,
  name: 'remove_label_from_thread',
  displayName: 'Remove Label from Thread',
  description: 'Strip a label from all emails in a thread.',
  props: {
    thread_id: GmailProps.thread,
    label_ids: Property.Array({
      displayName: 'Labels',
      description: 'One or more label IDs to remove from the thread.',
      required: true,
    }),
  },
  async run(context) {
    const authClient = await createGoogleClient(context.auth);
    const gmail = google.gmail({ version: 'v1', auth: authClient });

    const response = await gmail.users.threads.modify({
      userId: 'me',
      id: context.propsValue.thread_id,
      requestBody: {
        removeLabelIds: context.propsValue.label_ids as string[],
      },
    });

    return response.data;
  },
});
