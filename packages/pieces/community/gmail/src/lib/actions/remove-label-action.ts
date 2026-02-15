import { createAction, Property } from '@activepieces/pieces-framework';
import { gmailAuth } from '../../';
import { GmailProps } from '../common/props';
import { GmailRequests } from '../common/data';
import { google } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';

export const gmailRemoveLabelAction = createAction({
  auth: gmailAuth,
  name: 'remove_label_from_email',
  displayName: 'Remove Label from Email',
  description: 'Remove a label from a specific email message',
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

        try {
          const response = await GmailRequests.getLabels(auth);
          
          // Include both user and system labels for removal
          const allLabels = response.body.labels.filter(
            (label) => label.name !== 'UNREAD' && label.name !== 'DRAFT'
          );

          return {
            disabled: false,
            options: allLabels.map((label) => ({
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
          removeLabelIds: [labelId],
        },
      });

      return {
        success: true,
        messageId: messageId,
        labelId: labelId,
        response: response.data,
      };
    } catch (error) {
      throw new Error(`Failed to remove label from email: ${error.message}`);
    }
  },
});