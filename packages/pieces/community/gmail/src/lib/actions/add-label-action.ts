import { createAction, Property } from '@activepieces/pieces-framework';
import { gmailAuth } from '../../';
import { GmailProps } from '../common/props';
import { GmailRequests } from '../common/data';
import { google } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';

export const gmailAddLabelAction = createAction({
  auth: gmailAuth,
  name: 'add_label_to_email',
  displayName: 'Add Label to Email',
  description: 'Add a label to a specific email message',
  props: {
    message: GmailProps.message,
    label: Property.Dropdown({
      displayName: 'Label',
      description: 'Select the label to add to the email',
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

        try {
          const response = await GmailRequests.getLabels(auth);
          
          // Filter out system labels that aren't suitable for adding manually
          const userLabels = response.body.labels.filter(
            (label) => label.type === 'user' || 
            (label.type === 'system' && ['IMPORTANT', 'STARRED'].includes(label.name))
          );

          return {
            disabled: false,
            options: userLabels.map((label) => ({
              label: label.name,
              value: label.id,
            })),
          };
        } catch (error) {
          return {
            disabled: false,
            options: [],
            placeholder: 'Error loading labels',
          };
        }
      },
    }),
  },
  async run(context) {
    const authClient = new OAuth2Client();
    authClient.setCredentials(context.auth);

    const gmail = google.gmail({ version: 'v1', auth: authClient });

    const messageId = context.propsValue.message;
    const labelId = context.propsValue.label;

    try {
      const response = await gmail.users.messages.modify({
        userId: 'me',
        id: messageId,
        requestBody: {
          addLabelIds: [labelId],
        },
      });

      return {
        success: true,
        messageId: messageId,
        labelId: labelId,
        response: response.data,
      };
    } catch (error) {
      throw new Error(`Failed to add label to email: ${error.message}`);
    }
  },
});