import { createAction, Property } from '@activepieces/pieces-framework';
import { gmailAuth } from '../../';
import { GmailProps } from '../common/props';
import { google } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';

export const gmailRemoveLabelAction = createAction({
  auth: gmailAuth,
  name: 'remove_label',
  description: 'Remove a label from an email',
  displayName: 'Remove Label from Email',
  props: {
    message: GmailProps.message,
    label: Property.Dropdown({
      displayName: 'Label',
      description: 'Select the label to remove from the email',
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

        const authClient = new OAuth2Client();
        authClient.setCredentials(auth);
        const gmail = google.gmail({ version: 'v1', auth: authClient });

        const response = await gmail.users.labels.list({
          userId: 'me',
        });

        const labels = response.data.labels || [];

        return {
          disabled: false,
          options: labels.map((label) => ({
            label: label.name || '',
            value: label.id || '',
          })),
        };
      },
    }),
  },
  async run(context) {
    const authClient = new OAuth2Client();
    authClient.setCredentials(context.auth);

    const gmail = google.gmail({ version: 'v1', auth: authClient });

    const messageId = context.propsValue.message;
    const labelId = context.propsValue.label;

    const response = await gmail.users.messages.modify({
      userId: 'me',
      id: messageId,
      requestBody: {
        removeLabelIds: [labelId],
      },
    });

    return response.data;
  },
});
