import { createAction, Property } from '@activepieces/pieces-framework';
import { gmailAuth, createGoogleClient, GmailAuthValue } from '../auth';
import { google } from 'googleapis';
import { GmailRequests } from '../common/data';

export const gmailAddLabelAction = createAction({
  auth: gmailAuth,
  name: 'gmail_add_label',
  displayName: 'Add Label to Email',
  description: 'Add a label to an email.',
  props: {
    message_id: Property.ShortText({
      displayName: 'Message ID',
      description: 'The ID of the email message.',
      required: true,
    }),
    label_id: Property.Dropdown({
      displayName: 'Label',
      description: 'The label to add to the email.',
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

    const response = await gmail.users.messages.modify({
      userId: 'me',
      id: context.propsValue.message_id,
      requestBody: {
        addLabelIds: [context.propsValue.label_id],
      },
    });

    return response.data;
  },
});
