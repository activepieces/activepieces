import { createAction } from '@activepieces/pieces-framework';
import { gmailAuth } from '../../';
import { google } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';
import { GmailRequests } from '../common/data';
import { GmailProps } from '../common/props';
import { GmailLabel } from '../common/models';

export const gmailRemoveLabelFromEmailAction = createAction({
  auth: gmailAuth,
  name: 'remove_label_from_email',
  description: 'Remove one or more labels from a specific email message.',
  displayName: 'Remove Label from Email',
  props: {
    message_id: GmailProps.message,
    labels: GmailProps.labelsToRemove,
  },
  async run(context) {
    const authClient = new OAuth2Client();
    authClient.setCredentials(context.auth);

    const gmail = google.gmail({ version: 'v1', auth: authClient });

    let originalMessage = null;
    let currentLabelIds: string[] = [];

    try {
      const messageResponse = await gmail.users.messages.get({
        userId: 'me',
        id: context.propsValue.message_id,
        format: 'minimal',
      });
      originalMessage = messageResponse.data;
      currentLabelIds = originalMessage.labelIds || [];
    } catch (error) {
      throw new Error(
        `Message with ID ${context.propsValue.message_id} not found or inaccessible`
      );
    }

    const selectedLabels = context.propsValue.labels as GmailLabel[];
    const labelIdsToRemove = selectedLabels.map((label) => label.id);

    if (labelIdsToRemove.length === 0) {
      throw new Error(
        'At least one label must be selected to remove from the message'
      );
    }

    if (labelIdsToRemove.length > 100) {
      throw new Error(
        'Cannot remove more than 100 labels from a message in a single request'
      );
    }

    const labelsNotOnMessage: string[] = [];
    if (currentLabelIds.length > 0) {
      labelIdsToRemove.forEach((labelId) => {
        if (!currentLabelIds.includes(labelId)) {
          labelsNotOnMessage.push(labelId);
        }
      });

      if (labelsNotOnMessage.length > 0) {
        const allLabelsResponse = await GmailRequests.getLabels(context.auth);
        const labelMap = allLabelsResponse.body.labels.reduce(
          (acc: { [key: string]: string }, label) => {
            acc[label.id] = label.name;
            return acc;
          },
          {}
        );

        const labelNames = labelsNotOnMessage.map((id) => labelMap[id] || id);
        throw new Error(
          `The following labels are not currently applied to this message: ${labelNames.join(
            ', '
          )}.`
        );
      }
    }

    try {
      const response = await gmail.users.messages.modify({
        userId: 'me',
        id: context.propsValue.message_id,
        requestBody: {
          removeLabelIds: labelIdsToRemove,
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

      throw new Error(`Failed to remove labels from message: ${error.message}`);
    }
  },
});
