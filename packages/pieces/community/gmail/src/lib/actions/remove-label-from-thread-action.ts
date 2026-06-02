import { createAction, Property } from '@activepieces/pieces-framework';
import { gmailAuth, createGoogleClient, GmailAuthValue } from '../auth';
import { google } from 'googleapis';
import { GmailRequests } from '../common/data';

export const gmailRemoveLabelFromThreadAction = createAction({
  auth: gmailAuth,
  name: 'gmail_remove_label_from_thread',
  displayName: 'Remove Label from Thread',
  description: 'Remove a label from all emails in a thread.',
  props: {
    thread_id: Property.ShortText({
      displayName: 'Thread ID',
      description: 'The ID of the thread.',
      required: true,
    }),
    label_id: Property.Dropdown({
      displayName: 'Label',
      description: 'The label to remove from the thread.',
      required: true,
      refreshers: [],
      auth: gmailAuth,
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please authenticate first',
          };
        }

        const response = await GmailRequests.getLabels(auth as GmailAuthValue);
        return {
          disabled: false,
          options: response.body.labels.map((label) => ({
            label: label.name,
            value: label.id,
          })),
        };
      },
    }),
  },
  async run(context) {
    const authClient = await createGoogleClient(context.auth);
    const gmail = google.gmail({ version: 'v1', auth: authClient });

    const response = await gmail.users.threads.modify({
      userId: 'me',
      id: context.propsValue.thread_id,
      requestBody: {
        removeLabelIds: [context.propsValue.label_id],
      },
    });

    return response.data;
  },
});
