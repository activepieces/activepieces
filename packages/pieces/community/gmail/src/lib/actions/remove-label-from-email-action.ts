import { createAction } from '@activepieces/pieces-framework';
import { gmailAuth } from '../../';
import { google } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';
import { GmailProps } from '../common/props';
import { GmailLabel } from '../common/models';

export const gmailRemoveLabelFromEmailAction = createAction({
  auth: gmailAuth,
  name: 'gmail_remove_label_from_email',
  displayName: 'Remove Label from Email',
  description: 'Remove one or more labels from an email message.',
  props: {
    message: GmailProps.message,
    labels: GmailProps.labels,
  },
  async run(context) {
    const authClient = new OAuth2Client();
    authClient.setCredentials(context.auth);

    const gmail = google.gmail({ version: 'v1', auth: authClient });
    const selectedLabels = context.propsValue.labels as GmailLabel[];
    const labelIds = selectedLabels.map((label) => label.id);

    if (labelIds.length === 0) {
      throw new Error('At least one label must be selected.');
    }

    try {
      const response = await gmail.users.messages.modify({
        userId: 'me',
        id: context.propsValue.message as string,
        requestBody: {
          removeLabelIds: labelIds,
        },
      });

      return response.data;
    } catch (error: any) {
      if (error.code === 404) {
        throw new Error(
          `Message with ID ${context.propsValue.message} not found.`
        );
      }
      throw error;
    }
  },
});
