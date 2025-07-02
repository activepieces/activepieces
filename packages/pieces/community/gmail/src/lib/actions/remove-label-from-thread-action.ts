import { createAction, Property } from '@activepieces/pieces-framework';
import { gmailAuth } from '../../';
import { google } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';
import { GmailRequests } from '../common/data';
import { GmailProps } from '../common/props';
import { GmailLabel } from '../common/models';

export const gmailRemoveLabelFromThreadAction = createAction({
  auth: gmailAuth,
  name: 'remove_label_from_thread',
  description: 'Removes one or more labels from all messages in a thread.',
  displayName: 'Remove Label from Thread',
  props: {
    thread_id: GmailProps.thread,
    labels_to_remove: Property.MultiSelectDropdown({
      displayName: 'Labels to Remove',
      description:
        'Select the labels to remove from all messages in the thread',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Connect your Gmail account first',
            options: [],
          };
        }

        try {
          const labelsResponse = await GmailRequests.getLabels(auth as any);
          const labels = labelsResponse.body.labels || [];

          const removableLabels = labels.filter((label) => {
            return (
              label.type === 'user' ||
              ['INBOX', 'UNREAD', 'STARRED', 'IMPORTANT'].includes(label.id)
            );
          });

          return {
            disabled: false,
            options: removableLabels.map((label) => ({
              label: label.name,
              value: JSON.stringify({ id: label.id, name: label.name }),
            })),
          };
        } catch (error) {
          return {
            disabled: true,
            placeholder: 'Failed to load labels',
            options: [],
          };
        }
      },
    }),
  },
  async run(context) {
    const authClient = new OAuth2Client();
    authClient.setCredentials(context.auth);

    const gmail = google.gmail({ version: 'v1', auth: authClient });

    let originalThread = null;
    let threadLabels: string[] = [];

    try {
      const threadResponse = await gmail.users.threads.get({
        userId: 'me',
        id: context.propsValue.thread_id,
        format: 'minimal',
      });
      originalThread = threadResponse.data;

      const allLabels = new Set<string>();
      (originalThread.messages || []).forEach((message) => {
        (message.labelIds || []).forEach((labelId) => allLabels.add(labelId));
      });
      threadLabels = Array.from(allLabels);
    } catch (error) {
      throw new Error(
        `Thread with ID ${context.propsValue.thread_id} not found or inaccessible`
      );
    }

    const selectedLabels = context.propsValue.labels_to_remove.map(
      (labelStr: string) => {
        try {
          return JSON.parse(labelStr) as GmailLabel;
        } catch {
          throw new Error(`Invalid label format: ${labelStr}`);
        }
      }
    );
    const labelIdsToRemove = selectedLabels.map((label) => label.id);

    if (labelIdsToRemove.length === 0) {
      throw new Error(
        'At least one label must be selected to remove from the thread'
      );
    }

    if (labelIdsToRemove.length > 100) {
      throw new Error(
        'Cannot remove more than 100 labels from a thread in a single request'
      );
    }

    try {
      const response = await gmail.users.threads.modify({
        userId: 'me',
        id: context.propsValue.thread_id,
        requestBody: {
          removeLabelIds: labelIdsToRemove,
        },
      });

      return response.data;
    } catch (error: any) {
      if (error.code === 404) {
        throw new Error(
          `Thread with ID ${context.propsValue.thread_id} not found`
        );
      } else if (error.code === 400) {
        if (error.message?.includes('Invalid label')) {
          throw new Error(
            'One or more selected labels are invalid or no longer exist'
          );
        } else if (error.message?.includes('Invalid thread')) {
          throw new Error(
            'Invalid thread ID format or thread no longer exists'
          );
        }
        throw new Error(`Invalid request: ${error.message}`);
      } else if (error.code === 403) {
        throw new Error(
          'Insufficient permissions to modify thread labels. Ensure the gmail.modify scope is granted.'
        );
      } else if (error.code === 429) {
        throw new Error(
          'Gmail API rate limit exceeded. Please try again later.'
        );
      } else if (error.code === 500) {
        throw new Error('Gmail API server error. Please try again later.');
      }

      throw new Error(`Failed to remove labels from thread: ${error.message}`);
    }
  },
});
