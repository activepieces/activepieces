import { createAction, Property } from '@activepieces/pieces-framework';
import { gmailAuth } from '../../';
import { google } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';
import { GmailLabel } from '../common/models';
import { GmailRequests } from '../common/data';

export const gmailRemoveLabelFromThreadAction = createAction({
  auth: gmailAuth,
  name: 'remove_label_from_thread',
  description: 'Remove a label from all messages in a thread',
  displayName: 'Remove Label from Thread',
  props: {
    thread_id: Property.ShortText({
      displayName: 'Thread ID',
      description: 'The ID of the email thread',
      required: true,
    }),
    label: Property.Dropdown<GmailLabel>({
      displayName: 'Label',
      description: 'The label to remove from the thread',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please authenticate first',
          };
        }
        const response = await GmailRequests.getLabels(auth as any);
        return {
          disabled: false,
          options: response.body.labels.map((label) => ({
            label: label.name,
            value: label,
          })),
        };
      },
    }),
  },
  async run(context) {
    const authClient = new OAuth2Client();
    authClient.setCredentials(context.auth);
    const gmail = google.gmail({ version: 'v1', auth: authClient });

    const response = await gmail.users.threads.modify({
      userId: 'me',
      id: context.propsValue.thread_id,
      requestBody: {
        removeLabelIds: [context.propsValue.label.id],
      },
    });

    return response.data;
  },
});
