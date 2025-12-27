import { createAction, Property } from '@activepieces/pieces-framework';
import { gmailAuth } from '../../';
import { google } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';
import { GmailLabel } from '../common/models';
import { GmailRequests } from '../common/data';

export const gmailAddLabelToThreadAction = createAction({
  auth: gmailAuth,
  name: 'add_label_to_thread',
  description: 'Add a label to all messages in a thread',
  displayName: 'Add Label to Thread',
  props: {
    thread_id: Property.ShortText({
      displayName: 'Thread ID',
      description: 'The ID of the email thread',
      required: true,
    }),
    label: Property.Dropdown<GmailLabel>({
      displayName: 'Label',
      description: 'The label to add to the thread',
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
        addLabelIds: [context.propsValue.label.id],
      },
    });

    return response.data;
  },
});
