import { createAction } from '@activepieces/pieces-framework';
import { gmailAuth } from '../../';
import { google } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';
import { GmailProps } from '../common/props';
import { GmailLabel } from '../common/models';

export const gmailAddLabelToEmailAction = createAction({
  auth: gmailAuth,
  name: 'add_label_to_email',
  description: 'Add one or more labels to a specific email message.',
  displayName: 'Add Label to Email',
  props: {
    message_id: GmailProps.message,
    labels: GmailProps.labels,
  },
  async run(context) {
    const authClient = new OAuth2Client();
    authClient.setCredentials(context.auth);

    const gmail = google.gmail({ version: 'v1', auth: authClient });

    let originalMessage = null;
    try {
      const messageResponse = await gmail.users.messages.get({
        userId: 'me',
        id: context.propsValue.message_id,
        format: 'minimal',
      });
      originalMessage = messageResponse.data;
    } catch (error) {
      throw new Error(
        `Message with ID ${context.propsValue.message_id} not found or inaccessible`
      );
    }

    const selectedLabels = context.propsValue.labels as GmailLabel[];
    const labelIdsToAdd = selectedLabels.map((label) => label.id);

    if (labelIdsToAdd.length === 0) {
      throw new Error(
        'At least one label must be selected to add to the message'
      );
    }

    if (labelIdsToAdd.length > 100) {
      throw new Error(
        'Cannot add more than 100 labels to a message in a single request'
      );
    }

    try {
      const response = await gmail.users.messages.modify({
        userId: 'me',
        id: context.propsValue.message_id,
        requestBody: {
          addLabelIds: labelIdsToAdd,
        },
      });

      return response.data;
    } catch (error: any) {
      if (error.code === 404) {
        throw new Error(
          `Message with ID ${context.propsValue.message_id} not found`
        );
      } else if (error.code === 400) {
        if (error.message?.includes('Invalid label')) {
          throw new Error(
            'One or more selected labels are invalid or no longer exist'
          );
        }
        throw new Error(`Invalid request: ${error.message}`);
      } else if (error.code === 403) {
        throw new Error(
          'Insufficient permissions to modify message labels. Ensure the gmail.modify scope is granted.'
        );
      } else if (error.code === 429) {
        throw new Error('API rate limit exceeded. Please try again later.');
      }

      throw new Error(`Failed to add labels to message: ${error.message}`);
    }
  },
});
